const Department = require('../models/Department');
const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');
const { getDateRange } = require('../utils/dateUtils');

exports.adminReport = async (req, res) => {
  const { filter } = req.query;

  try {
    const { startDate, endDate } = getDateRange(filter);

    const transactions = await Transaction.find({
      billDate: { $gte: startDate, $lte: endDate },
      status: 'verified'
    }).populate('department');

    const deptMap = {};
    for (let tx of transactions) {
      const deptId = tx.department._id;
      if (!deptMap[deptId]) {
        deptMap[deptId] = {
          name: tx.department.name,
          allocated: tx.department.allocatedFund,
          utilized: 0,
          transactions: []
        };
      }
      deptMap[deptId].utilized += tx.amount;
      deptMap[deptId].transactions.push(tx);
    }

    const departments = await Department.find();
    const result = departments.map((dept) => {
      const data = deptMap[dept._id] || { utilized: 0, transactions: [] };
      return {
        _id: dept._id,
        name: dept.name,
        allocated: dept.allocatedFund,
        utilized: data.utilized,
        balance: dept.allocatedFund - data.utilized,
        transactions: data.transactions
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Report failed', error: err.message });
  }
};

exports.exportAdminReportPDF = async (req, res) => {
  const { filter } = req.query;
  const PDFDocument = require('pdfkit');
  const { getDateRange } = require('../utils/dateUtils'); // ensure this is implemented

  try {
    const { startDate, endDate } = getDateRange(filter);
    const transactions = await Transaction.find({
      billDate: { $gte: startDate, $lte: endDate },
      status: 'verified'
    }).populate('department');

    const deptMap = {};
    let totalAllocated = 0;
    let totalUtilized = 0;

    for (const tx of transactions) {
      const dept = tx.department;
      if (!dept) continue;

      const deptId = dept._id.toString();
      if (!deptMap[deptId]) {
        deptMap[deptId] = {
          name: dept.name || 'Unnamed',
          allocated: dept.allocatedFund || 0,
          utilized: 0,
          transactions: []
        };
        totalAllocated += dept.allocatedFund || 0;
      }

      deptMap[deptId].utilized += tx.amount || 0;
      totalUtilized += tx.amount || 0;
      deptMap[deptId].transactions.push(tx);
    }

    const totalBalance = totalAllocated - totalUtilized;

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Financial_Statement.pdf"');
    doc.pipe(res);

    // HEADER
    doc.fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('COLLEGE FUND MANAGEMENT SYSTEM', { align: 'center' })
      .moveDown(0.2);

    doc.font('Helvetica')
      .fontSize(12)
      .fillColor('#7f8c8d')
      .text('Official Fund Allocation Statement', { align: 'center' })
      .moveDown(0.5);

    doc.fontSize(10)
      .text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, { align: 'center' })
      .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' })
      .moveDown(1.5);

    // INSTITUTION SUMMARY BOXES
    const boxW = 170;
    const boxY = doc.y;
    doc.rect(40, boxY, boxW, 60).fill('#e8f4fd').stroke('#3498db');
    doc.fontSize(12).fillColor('#2980b9').text('TOTAL ALLOCATED', 55, boxY + 10);
    doc.fontSize(16).fillColor('#2c3e50').text(`₹${totalAllocated.toLocaleString()}`, 55, boxY + 30);

    doc.rect(40 + boxW + 10, boxY, boxW, 60).fill('#eafaf1').stroke('#27ae60');
    doc.fontSize(12).fillColor('#27ae60').text('TOTAL UTILIZED', 55 + boxW + 10, boxY + 10);
    doc.fontSize(16).fillColor('#2c3e50').text(`₹${totalUtilized.toLocaleString()}`, 55 + boxW + 10, boxY + 30);

    doc.rect(40 + 2 * (boxW + 10), boxY, boxW, 60).fill('#fef9e7').stroke('#f39c12');
    doc.fontSize(12).fillColor('#f39c12').text('NET BALANCE', 55 + 2 * (boxW + 10), boxY + 10);
    doc.fontSize(16).fillColor('#2c3e50').text(`₹${totalBalance.toLocaleString()}`, 55 + 2 * (boxW + 10), boxY + 30);

    doc.moveDown(4);

    // DEPARTMENT TABLE HEADER
    doc.fontSize(14).fillColor('#2c3e50').text('Department-wise Allocation', { align: 'center', underline: true }).moveDown(0.8);

    const headers = ['Department', 'Allocated', 'Utilized', 'Balance'];
    const cols = [50, 250, 350, 450];

    doc.fontSize(10).fillColor('#7f8c8d');
    headers.forEach((h, i) => doc.text(h, cols[i], doc.y));
    doc.moveTo(40, doc.y + 12).lineTo(doc.page.width - 40, doc.y + 12).stroke().moveDown(0.5);

    Object.values(deptMap).forEach((dept, i) => {
      if (doc.y > doc.page.height - 100) doc.addPage();

      const balance = dept.allocated - dept.utilized;
      if (i % 2 === 0) {
        doc.rect(40, doc.y - 4, doc.page.width - 80, 20).fill('#f9f9f9');
      }

      doc.fillColor('#2c3e50').fontSize(10);
      doc.text(dept.name, cols[0], doc.y);
      doc.text(`₹${dept.allocated.toLocaleString()}`, cols[1], doc.y);
      doc.text(`₹${dept.utilized.toLocaleString()}`, cols[2], doc.y);
      doc.fillColor(balance < 0 ? '#e74c3c' : '#27ae60').text(`₹${balance.toLocaleString()}`, cols[3], doc.y);
      doc.fillColor('#2c3e50');
      doc.moveDown(1);
    });

    doc.addPage();

    // DETAILED TRANSACTIONS
    Object.values(deptMap).forEach((dept) => {
      if (doc.y > doc.page.height - 150) doc.addPage();
      doc.fontSize(14).fillColor('#2c3e50').text(`${dept.name} Transactions`, { underline: true }).moveDown(0.5);
      doc.fontSize(10).fillColor('#7f8c8d')
        .text(`Allocated: ₹${dept.allocated.toLocaleString()} | Utilized: ₹${dept.utilized.toLocaleString()} | Balance: ₹${(dept.allocated - dept.utilized).toLocaleString()}`)
        .moveDown(0.5);

      const tHeaders = ['Date', 'Bill No', 'Purpose', 'Amount'];
      const tCols = [50, 120, 220, 450];

      doc.fontSize(9).fillColor('#7f8c8d');
      tHeaders.forEach((h, i) => doc.text(h, tCols[i], doc.y));
      doc.moveTo(40, doc.y + 10).lineTo(doc.page.width - 40, doc.y + 10).stroke().moveDown(0.5);

      dept.transactions.forEach((tx, i) => {
        if (doc.y > doc.page.height - 50) doc.addPage();
        if (i % 2 === 0) doc.rect(40, doc.y - 3, doc.page.width - 80, 16).fill('#f9f9f9');

        const date = tx.billDate ? new Date(tx.billDate).toLocaleDateString('en-GB') : '-';
        const billNo = tx.billNo || '-';
        const purpose = tx.purpose ? tx.purpose.slice(0, 40) + (tx.purpose.length > 40 ? '...' : '') : '-';
        const amount = `₹${tx.amount?.toLocaleString() || 0}`;

        doc.fillColor('#2c3e50').fontSize(9);
        doc.text(date, tCols[0], doc.y);
        doc.text(billNo, tCols[1], doc.y);
        doc.text(purpose, tCols[2], doc.y);
        doc.text(amount, tCols[3], doc.y);
        doc.moveDown(1);
      });

      doc.moveDown(2);
    });

    // FOOTER
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#7f8c8d');
      doc.text('Generated by Finance Management System', 40, doc.page.height - 40);
      doc.text(`Page ${i + 1} of ${pageCount}`, doc.page.width - 100, doc.page.height - 40);
    }

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ message: 'Export failed', error: err.message });
  }
};    

exports.hodReport = async (req, res) => {
  const { filter } = req.query;
  const deptId = req.user.department;

  try {
    const { startDate, endDate } = getDateRange(filter);

    // Fetch department info
    const department = await Department.findById(deptId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    // Get actual bill transactions
    const transactions = await Transaction.find({
      department: deptId,
      billDate: { $gte: startDate, $lte: endDate }
    });

    // Simulated record for initial fund allocation (treated like a "virtual transaction")
    const allocatedEntry = {
      _id: 'admin-allocated-fund',
      billNo: 'ALLOCATED',
      billDate: department.createdAt || new Date(),
      amount: department.allocatedFund || 0,
      purpose: 'Admin allocated initial department fund',
      status: 'allocated',
      isVirtual: true // Optional for internal tracking if needed
    };

    // Combine the allocation with the actual transactions
    const allTransactions = [allocatedEntry, ...transactions];

    // Compute total used only from real transactions (status !== 'allocated')
    const utilized = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      department: department.name,
      allocated: department.allocatedFund,
      utilized,
      balance: department.allocatedFund - utilized,
      transactions: allTransactions
    });

  } catch (err) {
    console.error('hodReport error:', err.message);
    res.status(500).json({ message: 'Report failed', error: err.message });
  }
};

