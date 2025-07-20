const Transaction = require('../models/Transaction');
const Department = require('../models/Department');
const mergePDFs = require('../utils/pdfMerger');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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

    // Generate a unique, UPI-style transaction ID
    function generateTransactionId() {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      return `TXN${timestamp}${random}`;
    }

    const tx = await Transaction.create({
      department: departmentId,
      amount: Number(amount),
      billNo,
      billDate,
      purpose,
      documents: [mergedPath],
      createdBy: req.user._id,
      transactionId: generateTransactionId()
    });

    console.log('✅ Bill uploaded successfully:', tx._id);
    res.json(tx);
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// Coordinator: Upload bill (with constraints)
exports.uploadBillCoordinator = async (req, res) => {
  try {
    // 1. Role check
    if (!req.user || req.user.role !== 'coordinator') {
      return res.status(403).json({ message: 'Only Coordinators can upload bills.' });
    }
    const coordinatorId = req.user._id;
    const departmentId = req.user.department;
    if (!departmentId) {
      return res.status(400).json({ message: 'No department found for Coordinator.' });
    }
    // 2. Department and fund allocation check
    const department = await Department.findById(departmentId);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    if (!department.fundAllocations || department.fundAllocations.length === 0) {
      return res.status(400).json({ message: 'No fund allocations found for this department.' });
    }
    // 3. Check if today is within the selected semester's allocation
    const { purpose, amount, semester } = req.body;
    const today = new Date();
    const selectedAllocation = department.fundAllocations.find(alloc => {
      return alloc.semester === semester && today >= new Date(alloc.startDate) && today <= new Date(alloc.endDate);
    });
    if (!selectedAllocation) {
      return res.status(400).json({ message: 'No active fund allocation for the selected semester and current date.' });
    }
    // 4. Check if the bill amount exceeds the allocation for the semester
    const totalUtilized = await Transaction.aggregate([
      { $match: {
          department: new mongoose.Types.ObjectId(department._id),
          semester: selectedAllocation.semester,
          year: selectedAllocation.year,
          status: { $in: ['pending', 'verified'] }
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const alreadyUtilized = totalUtilized.length > 0 ? totalUtilized[0].total : 0;
    if (alreadyUtilized + Number(amount) > selectedAllocation.amount) {
      return res.status(400).json({ message: `Bill exceeds the allocated amount for semester ${selectedAllocation.semester}. Remaining: Rs. ${selectedAllocation.amount - alreadyUtilized}` });
    }
    // 4. File check
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    // 5. Auto-generate bill number and transaction ID
    function generateTransactionId() {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      return `TXN${timestamp}${random}`;
    }
    function generateBillNo() {
      return `BILL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`;
    }
    const billNo = generateBillNo();
    const billDate = today;
    // 6. Save merged PDF
    const folder = path.join(__dirname, '..', 'uploads', departmentId.toString());
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    const mergedPath = path.join(folder, `${billNo}_merged.pdf`);
    const fullPaths = req.files.map(f => f.path);
    await mergePDFs(fullPaths, mergedPath);
    // 7. Save transaction
    const tx = await Transaction.create({
      department: departmentId,
      amount: Number(amount),
      billNo,
      billDate,
      purpose,
      documents: [mergedPath],
      createdBy: coordinatorId,
      transactionId: generateTransactionId(),
      semester: selectedAllocation.semester,
      year: selectedAllocation.year
    });
    res.status(201).json(tx);
  } catch (err) {
    console.error('Coordinator upload error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// 🔎 Admin: View all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { date, month, year, semester, department } = req.query;
    const query = {};
    if (department) query.department = department;
    if (date) {
      // Filter by specific date (YYYY-MM-DD)
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (month) {
      // Filter by month (YYYY-MM)
      const [y, m] = month.split('-');
      const start = new Date(Number(y), Number(m) - 1, 1);
      const end = new Date(Number(y), Number(m), 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (year) {
      // Filter by year (YYYY)
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (semester) {
      // Filter by semester string (exact match)
      query.semester = semester;
    }
    const txs = await Transaction.find(query).populate('department createdBy');
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

// 👤 HOD: View own department's transactions
exports.getMyTransactions = async (req, res) => {
  try {
    const { date, month, year, semester } = req.query;
    let query = {};
    // HOD: all department transactions; Coordinator: only their uploads
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'coordinator') {
      query.department = req.user.department;
      query.createdBy = req.user._id;
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Filtering
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (month) {
      const [y, m] = month.split('-');
      const start = new Date(Number(y), Number(m) - 1, 1);
      const end = new Date(Number(y), Number(m), 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (semester) {
      query.semester = semester;
    }
    const txs = await Transaction.find(query).sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your transactions', error: err.message });
  }
};

// 🧾 HOD: Verify or Reject a transaction (only for their department, only if uploaded by their Coordinator)
exports.verifyTransaction = async (req, res) => {
  const { status } = req.body;

  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    // Only allow HODs to verify transactions for their own department
    if (!req.user || req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Only HODs can verify bills.' });
    }
    const hodDepartmentId = req.user.department;
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    if (String(tx.department) !== String(hodDepartmentId)) {
      return res.status(403).json({ message: 'You can only verify bills for your own department.' });
    }
    // Get department to check Coordinator
    const DepartmentModel = require('../models/Department');
    const department = await DepartmentModel.findById(hodDepartmentId);
    if (!department || !department.coordinatorUser) {
      return res.status(403).json({ message: 'No Coordinator assigned for your department.' });
    }
    if (String(tx.createdBy) !== String(department.coordinatorUser)) {
      return res.status(403).json({ message: 'You can only verify bills uploaded by your department Coordinator.' });
    }
    // Update status
    tx.status = status;
    await tx.save();
    // If verified, update utilizedFund
    if (status === 'verified') {
      department.utilizedFund += tx.amount;
      await department.save();
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
    console.log('🔍 Download request for transaction ID:', req.params.id);
    
    const tx = await Transaction.findById(req.params.id);
    if (!tx) {
      console.log('❌ Transaction not found:', req.params.id);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    console.log('📄 Transaction found:', {
      id: tx._id,
      billNo: tx.billNo,
      documents: tx.documents,
      documentsLength: tx.documents?.length
    });

    if (!tx.documents || tx.documents.length === 0) {
      console.log('❌ No documents found for transaction:', tx._id);
      return res.status(404).json({ message: 'No documents found for this transaction' });
    }

    const pdfPath = tx.documents[0];
    console.log('📁 Attempting to download file:', pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ File not found on disk:', pdfPath);
      return res.status(404).json({ message: 'File missing from disk' });
    }

    console.log('✅ File exists, starting download...');

    // Set proper headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill_${tx.billNo || tx._id}.pdf"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading file' });
      }
    });
    
    fileStream.on('end', () => {
      console.log('✅ File download completed successfully');
    });
    
  } catch (err) {
    console.error('❌ Download error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to download PDF', error: err.message });
    }
  }
};

// Admin: Export transactions as Excel
exports.exportTransactionsExcel = async (req, res) => {
  try {
    const { date, month, year, semester, department } = req.query;
    // Build filter for transactions
    const query = {};
    if (department) query.department = department;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (month) {
      const [y, m] = month.split('-');
      const start = new Date(Number(y), Number(m) - 1, 1);
      const end = new Date(Number(y), Number(m), 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      query.billDate = { $gte: start, $lt: end };
    }
    if (semester) {
      query.semester = semester;
    }
    // Fetch all departments for allocations
    const departments = await Department.find();
    // Fetch all filtered transactions
    const txs = await Transaction.find(query).populate('department createdBy');
    // Build allocation records
    let allocationRows = [];
    for (const dept of departments) {
      if (!dept.fundAllocations) continue;
      for (const alloc of dept.fundAllocations) {
        // Apply filters to allocations
        if (department && String(dept._id) !== String(department)) continue;
        if (semester && String(alloc.semester) !== String(semester)) continue;
        if (year && String(alloc.year) !== String(year)) continue;
        if (date) {
          const allocDate = alloc.startDate ? new Date(alloc.startDate) : null;
          if (!allocDate || allocDate.toISOString().slice(0,10) !== date) continue;
        }
        if (month) {
          const [y, m] = month.split('-');
          const allocDate = alloc.startDate ? new Date(alloc.startDate) : null;
          if (!allocDate || allocDate.getFullYear() !== Number(y) || (allocDate.getMonth()+1) !== Number(m)) continue;
        }
        allocationRows.push({
          date: alloc.startDate ? alloc.startDate.toISOString().slice(0,10) : '-',
          transactionId: `ALLOC-${dept._id.toString().slice(-4)}-${alloc._id ? alloc._id.toString().slice(-6) : (alloc.startDate ? alloc.startDate.getTime() : Date.now())}`,
          department: dept.name,
          billNo: 'N/A',
          purpose: 'Fund allocated by Admin',
          status: 'allocated',
          amount: alloc.amount
        });
      }
    }
    // Build transaction records
    let transactionRows = txs.map(tx => ({
      date: tx.billDate ? tx.billDate.toISOString().slice(0,10) : '-',
      transactionId: tx.transactionId || '-',
      department: tx.department?.name || '-',
      billNo: tx.billNo || '-',
      purpose: tx.purpose || '-',
      status: tx.status,
      amount: tx.amount || 0
    }));
    // Merge and sort by date (descending)
    let allRows = [...allocationRows, ...transactionRows];
    allRows.sort((a, b) => new Date(b.date) - new Date(a.date));
    // Excel export
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transactions');
    sheet.addRow(['Date', 'Transaction ID', 'Department', 'Bill No', 'Purpose', 'Status', 'Amount']);
    allRows.forEach(row => {
      sheet.addRow([
        row.date,
        row.transactionId,
        row.department,
        row.billNo,
        row.purpose,
        row.status,
        row.amount
      ]);
    });
    sheet.columns.forEach(col => { col.width = 20; });
    sheet.getRow(1).font = { bold: true };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.xlsx"');
    await workbook.xlsx.write(res);
    // res.end(); // Removed to prevent double-ending the response stream
  } catch (err) {
    console.error('Admin Excel export error:', err);
    if (typeof allRows !== 'undefined') {
      console.error('Rows being exported:', JSON.stringify(allRows, null, 2));
    }
    res.status(500).json({ message: 'Failed to generate Excel', error: err.message, stack: err.stack });
  }
};
