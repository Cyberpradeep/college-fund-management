const Department = require('../models/Department');
const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Create department and HOD
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const department = await Department.create({ name, description });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name + ' HOD',
      email,
      password: hashedPassword,
      role: 'hod',
      department: department._id
    });

    department.hodUser = user._id;
    await department.save();

    res.status(201).json({ department, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create department', error: err.message });
  }
};

// Get all departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('hodUser', 'email');
    const enriched = await Promise.all(departments.map(async dept => {
      const transactions = await Transaction.find({
        department: dept._id,
        status: 'verified'
      });

      const utilized = transactions.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        ...dept.toObject(),
        hod: dept.hodUser ? { email: dept.hodUser.email } : null,
        utilizedFund: utilized
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('getDepartments error:', err);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
};

// Update department details
exports.updateDepartment = async (req, res) => {
  const { name, description } = req.body;
  const updated = await Department.findByIdAndUpdate(
    req.params.id,
    { name, description },
    { new: true }
  );
  res.json(updated);
};

// Allocate fund
exports.allocateFund = async (req, res) => {
  const { amount } = req.body;
  const dept = await Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found' });

  dept.allocatedFund += amount;
  await dept.save();
  res.json(dept);
};

// Get department report
exports.getDepartmentReport = async (req, res) => {
  const deptId = req.params.id;
  const department = await Department.findById(deptId);
  const transactions = await Transaction.find({ department: deptId });

  const utilized = transactions
    .filter(tx => tx.status === 'verified')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = department.allocatedFund - utilized;

  // 👇 Append a virtual transaction for allocated funds
  const allocationTransaction = {
    _id: 'admin-fund',
    billNo: 'N/A',
    purpose: 'Fund allocated by Admin',
    amount: department.allocatedFund,
    billDate: department.createdAt || new Date(),
    status: 'allocated',
    isVirtual: true
  };

  const fullTransactions = [allocationTransaction, ...transactions];

  res.json({
    department: department.name,
    allocated: department.allocatedFund,
    utilized,
    balance,
    transactions: fullTransactions
  });
};


// PDF Report
exports.downloadDepartmentReportPDF = async (req, res) => {
  const deptId = req.params.id;

  try {
    const department = await Department.findById(deptId);
    const transactions = await Transaction.find({ department: deptId });

    const utilized = transactions
      .filter(tx => tx.status === 'verified')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const balance = department.allocatedFund - utilized;

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${department.name}_report.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text(`Department Report: ${department.name}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Allocated: ₹${department.allocatedFund}`);
    doc.text(`Utilized: ₹${utilized}`);
    doc.text(`Balance: ₹${balance}`);
    doc.moveDown();
    doc.fontSize(14).text('Bills Summary', { underline: true });
    doc.moveDown();

    transactions.forEach((tx, i) => {
      doc.fontSize(11).text(`${i + 1}. Bill No: ${tx.billNo}`);
      doc.text(`   Date: ${tx.billDate?.toISOString().slice(0, 10)}`);
      doc.text(`   Amount: ₹${tx.amount}`);
      doc.text(`   Purpose: ${tx.purpose}`);
      doc.text(`   Status: ${tx.status}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err.message);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

exports.updateHodEmail = async (req, res) => {
  const { email } = req.body;
  const dept = await Department.findById(req.params.id);
  if (!dept || !dept.hodUser) return res.status(404).json({ message: 'Not found' });

  const existing = await User.findOne({ email });
  if (existing && existing._id.toString() !== dept.hodUser.toString()) {
    return res.status(400).json({ message: 'Email already taken' });
  }

  await User.findByIdAndUpdate(dept.hodUser, { email });
  res.json({ success: true });
};

exports.updateHodPassword = async (req, res) => {
  const { password } = req.body;
  const dept = await Department.findById(req.params.id);
   console.log(`Updating password for department: ${req.params.id}`);
  console.log(`Department found: ${dept ? 'Yes' : 'No'}`);
  
  if (!dept || !dept.hodUser) {
    return res.status(404).json({ message: 'Department or HOD not found' });
  }
  if (!dept || !dept.hodUser) return res.status(404).json({ message: 'Not found' });

  const hashed = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(dept.hodUser, { password: hashed });

  res.json({ success: true });
};


   

// ✅ Delete department & HOD
exports.deleteDepartment = async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Not found' });

  await User.findByIdAndDelete(dept.hodUser);
  await Department.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};


exports.downloadMyDepartmentReportPDF = async (req, res) => {
  try {
    const deptId = req.user.department;
    if (!deptId) return res.status(404).json({ message: 'No department' });

    const department = await Department.findById(deptId);
    const transactions = await Transaction.find({ department: deptId }).sort({ billDate: -1 });

    const utilized = transactions.filter(tx => tx.status === 'verified')
                                 .reduce((sum, tx) => sum + tx.amount, 0);
    const balance = department.allocatedFund - utilized;

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${department.name.replace(/\s+/g, '_')}_statement.pdf"`);
    doc.pipe(res);

    // Header with institution details
    doc.fillColor('#333333')
       .fontSize(16)
       .text('Financial Statement', { align: 'center' })
       .moveDown(0.2);
    
    doc.fontSize(10)
       .text(`Department: ${department.name}`, { align: 'center' })
       .text(`Statement Period: ${new Date().toLocaleDateString()}`, { align: 'center' })
       .moveDown(1);

    // Summary section with boxes
    const summaryY = doc.y;
    const boxWidth = 170;
    
    // Allocated funds box
    doc.rect(40, summaryY, boxWidth, 60)
       .fill('#f0f9ff')
       .stroke('#b8e2ff');
    doc.fontSize(12).fillColor('#0d6efd').text('ALLOCATED FUNDS', 55, summaryY + 10);
    doc.fontSize(14).fillColor('#333').text(`₹${department.allocatedFund.toLocaleString()}`, 55, summaryY + 30);
    
    // Utilized funds box
    doc.rect(40 + boxWidth + 10, summaryY, boxWidth, 60)
       .fill('#f0f8f5')
       .stroke('#b8e6d0');
    doc.fontSize(12).fillColor('#198754').text('UTILIZED FUNDS', 55 + boxWidth + 10, summaryY + 10);
    doc.fontSize(14).fillColor('#333').text(`₹${utilized.toLocaleString()}`, 55 + boxWidth + 10, summaryY + 30);
    
    // Balance box
    doc.rect(40 + (boxWidth * 2) + 20, summaryY, boxWidth, 60)
       .fill('#fff9f0')
       .stroke('#ffdfb8');
    doc.fontSize(12).fillColor('#fd7e14').text('AVAILABLE BALANCE', 55 + (boxWidth * 2) + 20, summaryY + 10);
    doc.fontSize(14).fillColor('#333').text(`₹${balance.toLocaleString()}`, 55 + (boxWidth * 2) + 20, summaryY + 30);

    doc.moveTo(40, summaryY + 70)
       .lineTo(doc.page.width - 40, summaryY + 70)
       .dash(2, { space: 4 })
       .stroke()
       .moveDown(3);

    // Transaction table header
    const tableTop = doc.y;
    const headers = ['Date', 'Bill No', 'Description', 'Amount', 'Status'];
    const colPositions = [50, 120, 190, 380, 480];
    
    doc.fontSize(10).fillColor('#6c757d');
    headers.forEach((header, i) => {
      doc.text(header, colPositions[i], tableTop);
    });
    
    doc.moveTo(40, tableTop + 15)
       .lineTo(doc.page.width - 40, tableTop + 15)
       .stroke()
       .moveDown(0.5);

    // Transaction rows
    let rowY = tableTop + 25;
    doc.fontSize(10).fillColor('#333');
    
    transactions.forEach((tx, idx) => {
      if (rowY > doc.page.height - 100) {
        doc.addPage();
        rowY = 50;
      }
      
      // Alternate row background
      if (idx % 2 === 0) {
        doc.rect(40, rowY - 8, doc.page.width - 80, 20)
           .fill('#f8f9fa');
      }
      
      const dt = tx.billDate ? 
        tx.billDate.toLocaleDateString('en-GB') : 
        '-';
      
      // Status color coding
      const statusColors = {
        'pending': '#fd7e14',
        'verified': '#198754',
        'rejected': '#dc3545'
      };
      
      doc.text(dt, colPositions[0], rowY);
      doc.text(tx.billNo || '-', colPositions[1], rowY);
      doc.text(tx.purpose.substring(0, 30) + (tx.purpose.length > 30 ? '...' : ''), 
              colPositions[2], rowY);
      doc.text(`₹${tx.amount.toLocaleString()}`, colPositions[3], rowY);
      doc.fillColor(statusColors[tx.status] || '#333')
         .text(tx.status.toUpperCase(), colPositions[4], rowY)
         .fillColor('#333');
      
      doc.moveTo(40, rowY + 15)
         .lineTo(doc.page.width - 40, rowY + 15)
         .stroke();
      
      rowY += 25;
    });

    // Footer
    doc.fontSize(9)
       .fillColor('#6c757d')
       .text('Generated by Finance Management System', 40, doc.page.height - 40, {
         align: 'left'
       })
       .text(`Page ${doc.bufferedPageRange().count}`, doc.page.width - 100, doc.page.height - 40, {
         align: 'right'
       });

    doc.end();
  } catch (err) {
    console.error('HOD PDF generation error:', err);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};