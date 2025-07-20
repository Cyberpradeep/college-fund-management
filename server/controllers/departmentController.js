const Department = require('../models/Department');
const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Create department and HOD
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, hodName, email, password } = req.body;

    // Check for existing department name
    const existingDept = await Department.findOne({ name });
    if (existingDept) return res.status(400).json({ message: 'Department name already exists' });

    // Check for any user with the email
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered as another user' });

    const department = await Department.create({ name, description });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: hodName || (name + ' HOD'),
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
    const departments = await Department.find().populate('hodUser', 'name email');
    const enriched = await Promise.all(departments.map(async dept => {
      const transactions = await Transaction.find({
        department: dept._id,
        status: 'verified'
      });

      const utilized = transactions.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        ...dept.toObject(),
        hod: dept.hodUser ? { name: dept.hodUser.name, email: dept.hodUser.email } : null,
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

// Allocate fund (semester-wise)
exports.allocateFund = async (req, res) => {
  const { amount, semester, year, startDate, endDate } = req.body;
  const dept = await Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found' });

  // Add new allocation to fundAllocations array
  dept.fundAllocations.push({
    amount,
    semester,
    year,
    startDate,
    endDate
  });
  // Update total allocatedFund
  dept.allocatedFund += amount;
  await dept.save();
  res.json(dept);
};

// Get department report
exports.getDepartmentReport = async (req, res) => {
  const deptId = req.params.id;
  const department = await Department.findById(deptId)
    .populate('hodUser', 'name email')
    .populate('coordinatorUser', 'name email');
  
  const transactions = await Transaction.find({ department: deptId }).select('-__v');

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
    hod: department.hodUser ? { name: department.hodUser.name, email: department.hodUser.email } : null,
    coordinatorUser: department.coordinatorUser ? { name: department.coordinatorUser.name, email: department.coordinatorUser.email } : null,
    transactions: fullTransactions
  });
};


// PDF Report
exports.downloadDepartmentReportPDF = async (req, res) => {
  const deptId = req.params.id;
  const { semester, date, month, year } = req.query;
  try {
    const department = await Department.findById(deptId);
    // Build filter for transactions
    const txQuery = { department: deptId };
    if (semester) txQuery.semester = semester;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      txQuery.billDate = { $gte: start, $lt: end };
    }
    if (month) {
      const [y, m] = month.split('-');
      const start = new Date(Number(y), Number(m) - 1, 1);
      const end = new Date(Number(y), Number(m), 1);
      txQuery.billDate = { $gte: start, $lt: end };
    }
    if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      txQuery.billDate = { $gte: start, $lt: end };
    }
    const transactions = await Transaction.find(txQuery);
    const utilized = transactions.filter(tx => tx.status === 'verified').reduce((sum, tx) => sum + tx.amount, 0);
    const balance = department.allocatedFund - utilized;
    // Virtual allocation row
    const allocationRow = {
      date: department.createdAt ? department.createdAt.toISOString().slice(0,10) : '-',
      billNo: 'N/A',
      purpose: 'Fund allocated by Admin',
      amount: department.allocatedFund,
      status: 'allocated',
    };
    // Prepare all rows
    const allRows = [allocationRow, ...transactions.map(tx => ({
      date: tx.billDate ? tx.billDate.toISOString().slice(0,10) : '-',
      billNo: tx.billNo || '-',
      purpose: tx.purpose || '-',
      amount: tx.amount || 0,
      status: tx.status || '-',
    }))];
    // PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${department.name}_report.pdf"`);
    doc.pipe(res);
    // Title
    doc.font('Helvetica-Bold').fontSize(16).fillColor('black').text(`Department Report: ${department.name}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('black').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);
    // Table header
    const headers = ['Date', 'Bill No', 'Purpose', 'Status', 'Amount'];
    let colWidths = [70, 70, 200, 80, 80];
    const fontSize = 9;
    const minRowHeight = 16;
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let totalPrefWidth = colWidths.reduce((a, b) => a + b, 0);
    if (totalPrefWidth > availableWidth) {
      const scale = availableWidth / totalPrefWidth;
      colWidths = colWidths.map(w => Math.floor(w * scale));
    }
    let y = doc.y;
    const startX = doc.page.margins.left;
    function drawTableHeader(y) {
      let x = startX;
      headers.forEach((h, i) => {
        doc.rect(x, y, colWidths[i], 18).stroke('#000');
        doc.fillColor('black').font('Helvetica-Bold').fontSize(fontSize).text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: 'left' });
        x += colWidths[i];
      });
      return y + 18;
    }
    function getCellHeight(text, width, fontSize = 9) {
      if (!text) return minRowHeight;
      return Math.max(minRowHeight, doc.heightOfString(String(text), { width: width - 4, font: 'Helvetica', size: fontSize }));
    }
    y = drawTableHeader(y);
    if (allRows.length === 0) {
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), minRowHeight).stroke('#000');
      doc.fillColor('black').font('Helvetica').fontSize(fontSize).text('No transactions found.', startX + 2, y + 5, { width: colWidths.reduce((a, b) => a + b, 0) - 4, align: 'left' });
      y += minRowHeight;
    } else {
      allRows.forEach((row, idx) => {
        let x = startX;
        const values = [row.date, row.billNo, row.purpose, row.status, typeof row.amount === 'number' ? `Rs. ${row.amount.toLocaleString()}` : '-'];
        const cellHeights = values.map((val, i) => getCellHeight(val, colWidths[i], fontSize));
        const rowHeight = Math.max(...cellHeights);
        if (idx % 2 === 0) {
          doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#f5f5f5');
        }
        x = startX;
        values.forEach((val, i) => {
          doc.rect(x, y, colWidths[i], rowHeight).stroke('#000');
          doc.fillColor('black').font('Helvetica').fontSize(fontSize).text(String(val), x + 2, y + 5, {
            width: colWidths[i] - 4,
            align: 'left'
          });
          x += colWidths[i];
        });
        y += rowHeight;
        if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
          doc.addPage();
          y = doc.y;
          y = drawTableHeader(y);
        }
      });
    }
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
  const dept = await Department.findById(req.params.id).populate('hodUser');
  if (!dept) return res.status(404).json({ message: 'Not found' });

  // Delete all users with the HOD email
  if (dept.hodUser) {
    await User.deleteMany({ email: dept.hodUser.email });
  }
  await Department.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};


exports.downloadMyDepartmentReportPDF = async (req, res) => {
  try {
    const deptId = req.user.department;
    if (!deptId) return res.status(404).json({ message: 'No department' });

    const { date, month, year, semester } = req.query;

    const department = await Department.findById(deptId);

    // Build query for transactions
    const txQuery = { department: deptId, status: 'verified' };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      txQuery.billDate = { $gte: start, $lt: end };
    } else if (month) {
      const [y, m] = month.split('-');
      const start = new Date(Number(y), Number(m) - 1, 1);
      const end = new Date(Number(y), Number(m), 1);
      txQuery.billDate = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      txQuery.billDate = { $gte: start, $lt: end };
    }

    if (semester) {
      txQuery.semester = semester;
    }

    const transactions = await Transaction.find(txQuery).sort({ billDate: -1 });

    const utilizedFunds = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    let allocatedFunds = 0;
    if (department.fundAllocations && department.fundAllocations.length > 0) {
      let filteredAllocations = department.fundAllocations;

      if (year) {
        filteredAllocations = filteredAllocations.filter(alloc => String(alloc.year) === year);
      }
      if (semester) {
        filteredAllocations = filteredAllocations.filter(alloc => alloc.semester === semester);
      }
      allocatedFunds = filteredAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    }

    const balance = allocatedFunds - utilizedFunds;

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
    doc.fontSize(14).fillColor('#333').text(`₹${allocatedFunds.toLocaleString()}`, 55, summaryY + 30);
    
    // Utilized funds box
    doc.rect(40 + boxWidth + 10, summaryY, boxWidth, 60)
       .fill('#f0f8f5')
       .stroke('#b8e6d0');
    doc.fontSize(12).fillColor('#198754').text('UTILIZED FUNDS', 55 + boxWidth + 10, summaryY + 10);
    doc.fontSize(14).fillColor('#333').text(`₹${utilizedFunds.toLocaleString()}`, 55 + boxWidth + 10, summaryY + 30);
    
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

// HOD: Add or update Coordinator for their department
exports.addOrUpdateCoordinator = async (req, res) => {
  try {
    // Only HODs can perform this action
    if (!req.user || req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Only HODs can manage Coordinator.' });
    }
    const departmentId = req.user.department;
    if (!departmentId) {
      return res.status(400).json({ message: 'No department found for HOD.' });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }
    // Check if a Coordinator already exists for this department
    let coordinator = null;
    if (department.coordinatorUser) {
      // Update existing Coordinator
      coordinator = await User.findById(department.coordinatorUser);
      if (!coordinator) {
        // If reference is stale, create new
        const hashedPassword = await bcrypt.hash(password, 10);
        coordinator = await User.create({
          name,
          email,
          password: hashedPassword,
          role: 'coordinator',
          department: departmentId
        });
        department.coordinatorUser = coordinator._id;
        await department.save();
      } else {
        // Update details (email uniqueness enforced by schema)
        coordinator.name = name;
        coordinator.email = email;
        if (password) {
          coordinator.password = await bcrypt.hash(password, 10);
        }
        await coordinator.save();
      }
    } else {
      // No Coordinator yet, create new
      // Check if email is already used
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered.' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      coordinator = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'coordinator',
        department: departmentId
      });
      department.coordinatorUser = coordinator._id;
      await department.save();
    }
    res.status(200).json({ coordinator });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add/update Coordinator', error: err.message });
  }
};

// HOD: Download department transactions as Excel
exports.downloadMyDepartmentReportExcel = async (req, res) => {
  try {
    const deptId = req.user.department;
    if (!deptId) return res.status(404).json({ message: 'No department' });

    const department = await Department.findById(deptId);
    const transactions = await Transaction.find({ department: deptId }).sort({ billDate: -1 });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transactions');

    // Header row
    sheet.addRow(['Date', 'Bill No', 'Description', 'Amount', 'Status']);

    // Data rows
    transactions.forEach(tx => {
      sheet.addRow([
        tx.billDate ? tx.billDate.toISOString().slice(0, 10) : '-',
        tx.billNo || '-',
        tx.purpose || '-',
        tx.amount || 0,
        tx.status || '-'
      ]);
    });

    // Formatting
    sheet.columns.forEach(col => {
      col.width = 20;
    });
    sheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${department.name.replace(/\s+/g, '_')}_statement.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('HOD Excel generation error:', err);
    res.status(500).json({ message: 'Failed to generate Excel' });
  }
};

// HOD: Get current Coordinator for their department
exports.getCoordinator = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Only HODs can view Coordinator.' });
    }
    const departmentId = req.user.department;
    if (!departmentId) {
      return res.status(400).json({ message: 'No department found for HOD.' });
    }
    const department = await Department.findById(departmentId).populate('coordinatorUser', 'name email');
    if (!department || !department.coordinatorUser) {
      return res.status(404).json({ message: 'No coordinator found.' });
    }
    res.json({ name: department.coordinatorUser.name, email: department.coordinatorUser.email });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch coordinator', error: err.message });
  }
};

// HOD: Delete Coordinator for their department
exports.deleteCoordinator = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Only HODs can delete Coordinator.' });
    }
    const departmentId = req.user.department;
    if (!departmentId) {
      return res.status(400).json({ message: 'No department found for HOD.' });
    }
    const department = await Department.findById(departmentId);
    if (!department || !department.coordinatorUser) {
      return res.status(404).json({ message: 'No coordinator to delete.' });
    }
    // Delete the coordinator user
    await User.findByIdAndDelete(department.coordinatorUser);
    department.coordinatorUser = null;
    await department.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete coordinator', error: err.message });
  }
};