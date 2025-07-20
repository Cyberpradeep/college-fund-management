const Department = require('../models/Department');
const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');
const { getDateRange } = require('../utils/dateUtils');

exports.adminReport = async (req, res) => {
  const { filter, department, semester, date, month, year } = req.query;

  try {
    let startDate, endDate;
    if (filter) {
      ({ startDate, endDate } = getDateRange(filter));
    }
    const query = { status: 'verified' };
    if (department) query.department = department;
    if (semester) query.semester = semester;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.billDate = { $gte: start, $lt: end };
    } else if (month) {
      const [y, m] = month.split('-');
      const start = new Date(Number(y), Number(m) - 1, 1);
      const end = new Date(Number(y), Number(m), 1);
      query.billDate = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      query.billDate = { $gte: start, $lt: end };
    } else if (startDate && endDate) {
      query.billDate = { $gte: startDate, $lte: endDate };
    }

    const transactions = await Transaction.find(query).populate('department');

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
  const { filter, department, semester, date, month, year } = req.query;
  const PDFDocument = require('pdfkit');
  const { getDateRange } = require('../utils/dateUtils');

  try {
    let startDate, endDate;
    if (filter) {
      ({ startDate, endDate } = getDateRange(filter));
    }
    // Build filter for transactions
    const txQuery = { status: 'verified' };
    if (department) txQuery.department = department;
    if (semester) txQuery.semester = semester;
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
    } else if (startDate && endDate) {
      txQuery.billDate = { $gte: startDate, $lte: endDate };
    }

    // Fetch all departments for allocations
    const departments = await Department.find();
    // Fetch all filtered transactions
    const transactions = await Transaction.find(txQuery).populate('department');

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
          transactionId: `ALLOC-${dept._id.toString().slice(-4)}-${alloc.startDate ? alloc.startDate.getTime() : Date.now()}`,
          department: dept.name,
          billNo: 'N/A',
          purpose: 'Fund allocated by Admin',
          status: 'allocated',
          amount: alloc.amount
        });
      }
    }

    // Build transaction records
    let transactionRows = transactions.map(tx => ({
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

    // Debug: log allRows
    console.log('PDF Export allRows:', allRows);

    // Generate PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.pdf"');
    doc.pipe(res);

    // Title
    doc.font('Helvetica-Bold').fontSize(16).fillColor('black').text('All Transactions Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('black').text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const headers = ['Date', 'Transaction ID', 'Department', 'Bill No', 'Purpose', 'Status', 'Amount'];
    // Preferred widths (sum = 560)
    let colWidths = [60, 110, 110, 50, 110, 60, 60];
    const minColWidths = [50, 80, 80, 40, 80, 40, 40];
    const fontSize = 8.5;
    const minRowHeight = 16;
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const totalPrefWidth = colWidths.reduce((a, b) => a + b, 0);
    // Scale columns if needed
    if (totalPrefWidth > availableWidth) {
      const scale = availableWidth / totalPrefWidth;
      colWidths = colWidths.map((w, i) => Math.max(Math.floor(w * scale), minColWidths[i]));
      // If still too wide, scale again
      let totalNow = colWidths.reduce((a, b) => a + b, 0);
      if (totalNow > availableWidth) {
        const scale2 = availableWidth / totalNow;
        colWidths = colWidths.map((w, i) => Math.max(Math.floor(w * scale2), minColWidths[i]));
      }
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

    function getCellHeight(text, width, fontSize = 8.5) {
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
        const values = [
          row.date || '-',
          row.transactionId || '-',
          row.department || '-',
          row.billNo || '-',
          row.purpose || '-',
          row.status || '-',
          typeof row.amount === 'number' ? `Rs. ${row.amount.toLocaleString()}` : '-'
        ];
        // Calculate row height for each cell, use the max for the row
        const cellHeights = values.map((val, i) => getCellHeight(val, colWidths[i], fontSize));
        const rowHeight = Math.max(...cellHeights);
        // Alternate row background
        if (idx % 2 === 0) {
          doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#f5f5f5');
        }
        // Draw cell borders and text
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
    console.error('PDF export error:', err);
    res.status(500).json({ message: 'Export failed', error: err.message });
  }
};

exports.hodReport = async (req, res) => {
  const { date, month, year, semester } = req.query;
  const deptId = req.user.department;

  try {
    // Fetch department info
    const department = await Department.findById(deptId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

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

    // Fetch transactions based on filters
    const transactions = await Transaction.find(txQuery);

    // Calculate utilized funds from filtered transactions
    const utilizedFunds = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate allocated funds based on filters
    let allocatedFunds = 0;
    let currentAllocation = null;
    if (department.fundAllocations && department.fundAllocations.length > 0) {
      let filteredAllocations = department.fundAllocations;

      if (year) {
        filteredAllocations = filteredAllocations.filter(alloc => String(alloc.year) === year);
      }
      if (semester) {
        filteredAllocations = filteredAllocations.filter(alloc => alloc.semester === semester);
      }
      allocatedFunds = filteredAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);

      // Find current active allocation (today between startDate and endDate)
      const today = new Date();
      currentAllocation = department.fundAllocations.find(alloc => {
        const start = new Date(alloc.startDate);
        const end = new Date(alloc.endDate);
        return start <= today && today <= end;
      }) || null;
    }

    res.json({
      department: department.name,
      allocatedFunds: allocatedFunds,
      utilizedFunds: utilizedFunds,
      balance: allocatedFunds - utilizedFunds,
      transactions: transactions,
      currentAllocation: currentAllocation
    });

  } catch (err) {
    console.error('hodReport error:', err.message);
    res.status(500).json({ message: 'Report failed', error: err.message });
  }
};

// HOD PDF Export: Black-and-white tabular PDF for HOD's department only
exports.exportHodReportPDF = async (req, res) => {
  const { date, month, year, semester } = req.query;
  const deptId = req.user.department;
  try {
    // Fetch department info
    const department = await Department.findById(deptId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

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

    // Fetch transactions
    const transactions = await Transaction.find(txQuery);

    // Build allocation records for this department
    let allocationRows = [];
    if (department.fundAllocations) {
      for (const alloc of department.fundAllocations) {
        // Apply filters
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
          transactionId: `ALLOC-${department._id.toString().slice(-4)}-${alloc.startDate ? alloc.startDate.getTime() : Date.now()}`,
          department: department.name,
          billNo: 'N/A',
          purpose: 'Fund allocated by Admin',
          status: 'allocated',
          amount: alloc.amount
        });
      }
    }

    // Build transaction records
    let transactionRows = transactions.map(tx => ({
      date: tx.billDate ? tx.billDate.toISOString().slice(0,10) : '-',
      transactionId: tx.transactionId || '-',
      department: department.name,
      billNo: tx.billNo || '-',
      purpose: tx.purpose || '-',
      status: tx.status,
      amount: tx.amount || 0
    }));

    // Merge and sort by date (descending)
    let allRows = [...allocationRows, ...transactionRows];
    allRows.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="hod_transactions_report.pdf"');
    doc.pipe(res);

    // Title: Department name and generated date/time
    doc.font('Helvetica-Bold').fontSize(16).fillColor('black').text(department.name, { align: 'center' });
    doc.moveDown(0.5);
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    doc.font('Helvetica').fontSize(10).fillColor('black').text(`Generated: ${dateStr} ${timeStr}`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const headers = ['Date', 'Transaction ID', 'Department', 'Bill No', 'Purpose', 'Status', 'Amount'];
    let colWidths = [60, 110, 110, 50, 110, 60, 60];
    const minColWidths = [50, 80, 80, 40, 80, 40, 40];
    const fontSize = 8.5;
    const minRowHeight = 16;
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const totalPrefWidth = colWidths.reduce((a, b) => a + b, 0);
    if (totalPrefWidth > availableWidth) {
      const scale = availableWidth / totalPrefWidth;
      colWidths = colWidths.map((w, i) => Math.max(Math.floor(w * scale), minColWidths[i]));
      let totalNow = colWidths.reduce((a, b) => a + b, 0);
      if (totalNow > availableWidth) {
        const scale2 = availableWidth / totalNow;
        colWidths = colWidths.map((w, i) => Math.max(Math.floor(w * scale2), minColWidths[i]));
      }
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

    function getCellHeight(text, width, fontSize = 8.5) {
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
        const values = [
          row.date || '-',
          row.transactionId || '-',
          row.department || '-',
          row.billNo || '-',
          row.purpose || '-',
          row.status || '-',
          typeof row.amount === 'number' ? `Rs. ${row.amount.toLocaleString()}` : '-'
        ];
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
    console.error('HOD PDF export error:', err);
    res.status(500).json({ message: 'Export failed', error: err.message });
  }
};

exports.coordinatorReport = async (req, res) => {
  const { date, month, year, semester } = req.query;
  const deptId = req.user.department;

  try {
    // Fetch department info
    const department = await Department.findById(deptId);
    if (!department) return res.status(404).json({ message: 'Department not found' });

    // Build query for transactions
    const txQuery = { department: deptId };

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

    // Fetch transactions based on filters
    const transactions = await Transaction.find(txQuery);

    // Calculate utilized funds from filtered transactions
    const utilizedFunds = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate allocated funds based on filters
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

    res.json({
      department: department.name,
      allocatedFunds: allocatedFunds,
      utilizedFunds: utilizedFunds,
      balance: allocatedFunds - utilizedFunds,
      transactions: transactions
    });

  } catch (err) {
    console.error('coordinatorReport error:', err.message);
    res.status(500).json({ message: 'Report failed', error: err.message });
  }
};

