const Transaction = require('../models/Transaction');
const Department = require('../models/Department');
const mergePDFs = require('../utils/pdfMerger');
const path = require('path');
const fs = require('fs');

// 🔐 Upload bill by HOD
exports.uploadBill = async (req, res) => {
  const { billNo, billDate, purpose, amount } = req.body;
  const departmentId = req.user?.department;

  try {
    console.log('📥 Upload initiated', {
      billNo,
      billDate,
      amount,
      departmentId,
      files: req.files?.length || 0
    });

    if (!departmentId) {
      return res.status(400).json({ message: 'Department not found in user profile' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const folder = path.join(__dirname, '..', 'uploads', departmentId.toString());
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const mergedPath = path.join(folder, `${billNo}_merged.pdf`);
    const fullPaths = req.files.map(f => f.path);

    await mergePDFs(fullPaths, mergedPath);

    const tx = await Transaction.create({
      department: departmentId,
      amount: Number(amount),
      billNo,
      billDate,
      purpose,
      documents: [mergedPath],
      createdBy: req.user._id
    });

    console.log('✅ Bill uploaded successfully:', tx._id);
    res.json(tx);
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// 🔎 Admin: View all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().populate('department createdBy');
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

// 👤 HOD: View own department's transactions
exports.getMyTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find({ department: req.user.department })
      .sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your transactions', error: err.message });
  }
};

// 🧾 Admin: Verify or Reject a transaction
exports.verifyTransaction = async (req, res) => {
  const { status } = req.body;

  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const tx = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    if (status === 'verified') {
      const dept = await Department.findById(tx.department);
      if (dept) {
        dept.utilizedFund += tx.amount;
        await dept.save();
      }
    }

    res.json(tx);
  } catch (err) {
    console.error('❌ Verify error:', err.message);
    res.status(500).json({ message: 'Verify failed', error: err.message });
  }
};

// 📎 Download merged PDF
exports.downloadMergedPDF = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx || !tx.documents.length) {
      return res.status(404).json({ message: 'Transaction or document not found' });
    }

    const pdfPath = tx.documents[0];
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'File missing from disk' });
    }

    res.download(pdfPath);
  } catch (err) {
    console.error('❌ Download error:', err.message);
    res.status(500).json({ message: 'Failed to download PDF', error: err.message });
  }
};
