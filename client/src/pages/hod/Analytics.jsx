// Analytics page removed as per requirements.
  const getFundUsageData = () => {
    if (!analytics) return {};
    return {
      labels: ['Allocated', 'Utilized', 'Balance'],
      datasets: [
        {
          label: 'Amount (Rs)',
          data: [analytics.allocatedFunds, analytics.utilizedFunds, analytics.balance],
          backgroundColor: ['#1976d2', '#43a047', '#fbc02d'],
        },
      ],
    };
  };

  const getTransactionsBySemester = () => {
    if (!analytics?.transactions) return {};
    const semMap = {};
    analytics.transactions.forEach(tx => {
      const sem = tx.semester || 'N/A';
      semMap[sem] = (semMap[sem] || 0) + tx.amount;
    });
    return {
      labels: Object.keys(semMap),
      datasets: [
        {
          label: 'Utilized (Rs)',
          data: Object.values(semMap),
          backgroundColor: '#1976d2',
        },
      ],
    };
  };

  const getTransactionsByMonth = () => {
    if (!analytics?.transactions) return {};
    const monthMap = {};
    analytics.transactions.forEach(tx => {
      if (!tx.billDate) return;
      const d = new Date(tx.billDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + tx.amount;
    });
    return {
      labels: Object.keys(monthMap),
      datasets: [
        {
          label: 'Utilized (Rs)',
          data: Object.values(monthMap),
          backgroundColor: '#43a047',
        },
      ],
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Fund Analytics
      </Typography>
      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item>
          <FormControl size="small">
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterType}
              label="Filter"
              onChange={e => {
                setFilterType(e.target.value);
                setFilterValue('');
              }}
            >
              {filterOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          <FormControl size="small">
            <InputLabel>Value</InputLabel>
            <Select
              value={filterValue}
              label="Value"
              onChange={e => setFilterValue(e.target.value)}
            >
              {/* TODO: Populate with real options from backend or static */}
              <MenuItem value="">All</MenuItem>
              {filterType === 'semester' && ['Odd', 'Even'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
              {/* Add more options for month/year/date as needed */}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : analytics ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Fund Usage</Typography>
              <Bar data={getFundUsageData()} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Utilization by Semester</Typography>
              <Bar data={getTransactionsBySemester()} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>Utilization by Month</Typography>
              <Line data={getTransactionsByMonth()} />
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
};

export default HoDAnalytics;
