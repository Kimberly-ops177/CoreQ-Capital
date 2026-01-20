import React, { useState } from 'react';
import {
  Container, Typography, Button, Grid, Card, CardContent,
  TextField, Box, Alert, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Navigation from './Navigation';

const Reporting = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // All 8 reports from Section 3.2
  const reports = [
    { key: 'loans-issued', title: 'Loans Issued Report', requiresDate: false, adminOnly: false },
    { key: 'loan-status', title: 'Loan Status Report', requiresDate: false, adminOnly: false },
    { key: 'defaulters', title: 'Defaulters Report', requiresDate: false, adminOnly: false },
    { key: 'not-yet-paid', title: 'Not Yet Paid Report', requiresDate: false, adminOnly: false },
    { key: 'defaulted-items', title: 'Defaulted Items Report', requiresDate: false, adminOnly: true },
    { key: 'balances', title: 'Balances Report', requiresDate: false, adminOnly: true },
    { key: 'expenses', title: 'Expenses Report', requiresDate: false, adminOnly: true },
    { key: 'profit-loss', title: 'Profit & Loss Report', requiresDate: false, adminOnly: true }
  ];

  const generateReport = async (type) => {
    try {
      setLoading(true);
      setError('');

      const report = reports.find(r => r.key === type);

      // Validate date requirements
      if (report.requiresDate && (!startDate || !endDate)) {
        setError('This report requires both start and end dates');
        setLoading(false);
        return;
      }

      let url = `/api/reports/${type}`;
      const params = new URLSearchParams();

      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setReportData(res.data);
      setReportType(type);
      setLoading(false);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.error || 'Error generating report');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadAsCSV = () => {
    let csvContent = '';
    const title = reports.find(r => r.key === reportType)?.title;

    // Different CSV formats for different reports
    switch (reportType) {
      case 'loan-status':
        csvContent = 'Loan Status Report\n\n';
        csvContent += `Total Loans,${reportData.summary.totalLoans}\n`;
        csvContent += `Active,${reportData.summary.activeCount}\n`;
        csvContent += `Due,${reportData.summary.dueCount}\n`;
        csvContent += `Past Due,${reportData.summary.pastDueCount}\n`;
        csvContent += `Paid,${reportData.summary.paidCount}\n`;
        csvContent += `Defaulted,${reportData.summary.defaultedCount}\n`;
        break;

      case 'loans-issued':
        csvContent = 'Loans Issued Report\n\n';
        csvContent += `Total Loans,${reportData.totalLoans}\n`;
        csvContent += `Total Amount Issued,${reportData.totalAmountIssued}\n\n`;
        csvContent += 'Loan ID,Borrower,Amount,Date Issued,Due Date,Status\n';
        reportData.loans?.forEach(loan => {
          csvContent += `${loan.id},"${loan.borrower?.name || 'N/A'}",${loan.amountIssued},${formatDate(loan.dateIssued)},${formatDate(loan.dueDate)},${loan.status}\n`;
        });
        break;

      case 'defaulters':
        csvContent = 'Defaulters Report\n\n';
        csvContent += `Total Defaulters,${reportData.totalDefaulters}\n`;
        csvContent += `Total Outstanding Balance,${reportData.totalOutstandingBalance}\n\n`;
        csvContent += 'Borrower Name,ID Number,Phone,Email,Outstanding Balance,Due Date\n';
        reportData.defaulters?.forEach(defaulter => {
          csvContent += `"${defaulter.borrower.name}",${defaulter.borrower.idNumber},${defaulter.borrower.phoneNumber},"${defaulter.borrower.email || 'N/A'}",${defaulter.loanDetails.outstandingBalance},${formatDate(defaulter.loanDetails.dueDate)}\n`;
        });
        break;

      case 'not-yet-paid':
        csvContent = 'Not Yet Paid Loans Report\n\n';
        csvContent += `Total Loans,${reportData.totalLoans}\n`;
        csvContent += `Total Outstanding Balance,${reportData.totalOutstandingBalance}\n\n`;
        csvContent += 'Loan ID,Borrower,Total Due,Balance,Due Date,Status\n';
        reportData.loans?.forEach(loan => {
          csvContent += `${loan.id},"${loan.borrower?.name || 'N/A'}",${loan.totalDue},${loan.balance},${formatDate(loan.dueDate)},${loan.status}\n`;
        });
        break;

      case 'defaulted-items':
        csvContent = 'Defaulted Items Report\n\n';
        csvContent += 'DEFAULTED ITEMS NOT SOLD\n';
        csvContent += `Total Unsold Items,${reportData.unsold.count}\n\n`;
        csvContent += 'DEFAULTED DATE,LOANID,ITEMID,Name,ID NUMBER,Phone number,ITEM\n';
        reportData.unsold.items?.forEach(item => {
          csvContent += `${formatDate(item.defaultedDate)},${item.loanId},${item.itemId},"${item.name}",${item.idNumber},"${item.phoneNumber}","${item.item}"\n`;
        });
        csvContent += '\n\nSOLD DEFAULTED ITEMS\n';
        csvContent += `Total Sold Items,${reportData.sold.count}\n`;
        csvContent += `Total Revenue,${reportData.sold.totalRevenue}\n\n`;
        csvContent += 'DEFAULTED DATE,ITEMID,Name,ID NUMBER,ITEM,MODEL NUMBER,AMOUNT,DATE SOLD,Phone number,AMOUNT ISSUED,AMOUNT PAYABLE\n';
        reportData.sold.items?.forEach(item => {
          csvContent += `${formatDate(item.defaultedDate)},${item.itemId},"${item.name}",${item.idNumber},"${item.item}","${item.modelNumber || 'N/A'}",${item.amount},${formatDate(item.dateSold)},"${item.phoneNumber}",${item.amountIssued},${item.amountPayable}\n`;
        });
        break;

      case 'balances':
        csvContent = 'Balances Report\n\n';
        csvContent += 'SUMMARY\n';
        csvContent += `Outstanding Loans,${reportData.summary.totalOutstandingLoans}\n`;
        csvContent += `Principal Issued,${reportData.summary.totalPrincipalIssued}\n`;
        csvContent += `Interest Expected,${reportData.summary.totalInterestExpected}\n`;
        csvContent += `Penalties Accrued,${reportData.summary.totalPenaltiesAccrued}\n`;
        csvContent += `Amount Repaid,${reportData.summary.totalAmountRepaid}\n`;
        csvContent += `Total Outstanding Receivables,${reportData.summary.totalOutstandingReceivables}\n\n`;
        csvContent += 'BREAKDOWN BY STATUS\n';
        csvContent += `Active,${reportData.breakdown.byStatus.active}\n`;
        csvContent += `Due,${reportData.breakdown.byStatus.due}\n`;
        csvContent += `Past Due,${reportData.breakdown.byStatus.pastDue}\n`;
        csvContent += `Defaulted,${reportData.breakdown.byStatus.defaulted}\n`;
        break;

      case 'expenses':
        csvContent = 'Expenses Report\n\n';
        csvContent += `Total Expenses,${reportData.summary.totalExpenses}\n`;
        csvContent += `Expense Count,${reportData.summary.expenseCount}\n`;
        csvContent += `Categories,${reportData.summary.categories}\n\n`;
        csvContent += 'Date,Category,Description,Amount\n';
        reportData.expenses?.forEach(expense => {
          csvContent += `${formatDate(expense.date)},${expense.category},"${expense.name}",${expense.amount}\n`;
        });
        break;

      case 'profit-loss':
        csvContent = 'Profit & Loss Report\n\n';
        csvContent += 'REVENUE\n';
        csvContent += `Interest Earned,${reportData.revenue.interestEarned}\n`;
        csvContent += `Penalties Collected,${reportData.revenue.penaltiesCollected}\n`;
        csvContent += `Revenue from Sold Collateral,${reportData.revenue.revenueFromSoldCollateral}\n`;
        csvContent += `Total Revenue,${reportData.revenue.totalRevenue}\n\n`;
        csvContent += 'EXPENSES\n';
        csvContent += `Total Expenses,${reportData.expenses.totalExpenses}\n`;
        csvContent += `Expense Count,${reportData.expenses.expenseCount}\n\n`;
        csvContent += 'PROFIT & LOSS\n';
        csvContent += `Net Profit/Loss,${reportData.profitLoss.netProfitLoss}\n`;
        csvContent += `Profit Margin,${reportData.profitLoss.profitMargin}%\n`;
        csvContent += `Status,${reportData.profitLoss.isProfitable ? 'Profitable' : 'Loss'}\n`;
        break;

      default:
        csvContent = 'Report data not available for CSV export\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderReportData = () => {
    if (!reportData) return null;

    const title = reports.find(r => r.key === reportType)?.title;

    return (
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#4A5FE8', fontWeight: 'bold' }}>
              {title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={downloadAsCSV}
                color="primary"
              >
                Download CSV
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.print()}
                color="primary"
              >
                Print
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Render different visualizations based on report type */}
          {reportType === 'loan-status' && renderLoanStatusReport()}
          {reportType === 'loans-issued' && renderLoansIssuedReport()}
          {reportType === 'defaulters' && renderDefaultersReport()}
          {reportType === 'not-yet-paid' && renderNotYetPaidReport()}
          {reportType === 'defaulted-items' && renderDefaultedItemsReport()}
          {reportType === 'balances' && renderBalancesReport()}
          {reportType === 'expenses' && renderExpensesReport()}
          {reportType === 'profit-loss' && renderProfitLossReport()}
        </Paper>
      </Box>
    );
  };

  // Report 1: Loans Issued Report
  const renderLoansIssuedReport = () => (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.9 }}>Total Loans</Typography>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>{reportData.totalLoans}</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.9 }}>Total Amount Issued</Typography>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {formatCurrency(reportData.totalAmountIssued)}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Loan ID</TableCell>
              <TableCell>Borrower</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date Issued</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.loans?.map((loan) => (
              <TableRow key={loan.id} hover>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{loan.borrower?.name || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(loan.amountIssued)}</TableCell>
                <TableCell>{formatDate(loan.dateIssued)}</TableCell>
                <TableCell>{formatDate(loan.dueDate)}</TableCell>
                <TableCell>
                  <Chip
                    label={loan.status}
                    size="small"
                    color={
                      loan.status === 'paid' ? 'success' :
                      loan.status === 'defaulted' ? 'error' :
                      loan.status === 'pastDue' ? 'warning' : 'primary'
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Report 2: Loan Status Report
  const renderLoanStatusReport = () => (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4A5FE8 0%, #6B7FF7 100%)', p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {reportData.summary.activeCount}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.9 }}>Active</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #FFB547 0%, #FF8F00 100%)', p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {reportData.summary.dueCount}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.9 }}>Due</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #E13F7A 100%)', p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {reportData.summary.pastDueCount}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.9 }}>Past Due</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #00D9B1 0%, #00A88A 100%)', p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {reportData.summary.paidCount}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.9 }}>Paid</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #C62828 0%, #8B0000 100%)', p: 2, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {reportData.summary.defaultedCount}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#fff', opacity: 0.9 }}>Defaulted</Typography>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#4A5FE8' }}>
        Total Loans: {reportData.summary.totalLoans}
      </Typography>
    </Box>
  );

  // Report 3: Defaulters Report
  const renderDefaultersReport = () => (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Defaulters</Typography>
            <Typography variant="h4" sx={{ color: '#C62828' }}>
              {reportData.totalDefaulters}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Outstanding</Typography>
            <Typography variant="h4" sx={{ color: '#C62828' }}>
              {formatCurrency(reportData.totalOutstandingBalance)}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><strong>Borrower Name</strong></TableCell>
              <TableCell><strong>ID Number</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Outstanding Balance</strong></TableCell>
              <TableCell><strong>Due Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.defaulters?.map((defaulter) => (
              <TableRow key={defaulter.loanId} hover>
                <TableCell>{defaulter.borrower.name}</TableCell>
                <TableCell>{defaulter.borrower.idNumber}</TableCell>
                <TableCell>{defaulter.borrower.phoneNumber}</TableCell>
                <TableCell>{defaulter.borrower.email || 'N/A'}</TableCell>
                <TableCell sx={{ color: '#C62828', fontWeight: 'bold' }}>
                  {formatCurrency(defaulter.loanDetails.outstandingBalance)}
                </TableCell>
                <TableCell>{formatDate(defaulter.loanDetails.dueDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Report 4: Not Yet Paid Report
  const renderNotYetPaidReport = () => (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Loans</Typography>
            <Typography variant="h4" sx={{ color: '#F57F17' }}>
              {reportData.totalLoans}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Outstanding</Typography>
            <Typography variant="h4" sx={{ color: '#F57F17' }}>
              {formatCurrency(reportData.totalOutstandingBalance)}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><strong>Loan ID</strong></TableCell>
              <TableCell><strong>Borrower</strong></TableCell>
              <TableCell><strong>Total Due</strong></TableCell>
              <TableCell><strong>Balance</strong></TableCell>
              <TableCell><strong>Due Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.loans?.map((loan) => (
              <TableRow key={loan.id} hover>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{loan.borrower?.name || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(loan.totalDue)}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#F57F17' }}>
                  {formatCurrency(loan.balance)}
                </TableCell>
                <TableCell>{formatDate(loan.dueDate)}</TableCell>
                <TableCell>
                  <Chip
                    label={loan.status}
                    size="small"
                    color={loan.status === 'pastDue' ? 'warning' : 'primary'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Report 5: Defaulted Items Report
  const renderDefaultedItemsReport = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, color: '#4A5FE8' }}>
        Defaulted Items Not Sold ({reportData.unsold.count})
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>DEFAULTED DATE</strong></TableCell>
              <TableCell><strong>LOANID</strong></TableCell>
              <TableCell><strong>ITEMID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>ID NUMBER</strong></TableCell>
              <TableCell><strong>Phone number</strong></TableCell>
              <TableCell><strong>ITEM</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.unsold.items?.map((item, index) => (
              <TableRow key={index} hover>
                <TableCell>{formatDate(item.defaultedDate)}</TableCell>
                <TableCell>{item.loanId}</TableCell>
                <TableCell>{item.itemId}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.idNumber}</TableCell>
                <TableCell>{item.phoneNumber}</TableCell>
                <TableCell>{item.item}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" sx={{ mb: 2, color: '#4A5FE8' }}>
        Sold Defaulted Items ({reportData.sold.count}) - Total Revenue: {formatCurrency(reportData.sold.totalRevenue)}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>DEFAULTED DATE</strong></TableCell>
              <TableCell><strong>ITEMID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>ID NUMBER</strong></TableCell>
              <TableCell><strong>ITEM</strong></TableCell>
              <TableCell><strong>MODEL NUMBER</strong></TableCell>
              <TableCell><strong>AMOUNT</strong></TableCell>
              <TableCell><strong>DATE SOLD</strong></TableCell>
              <TableCell><strong>Phone number</strong></TableCell>
              <TableCell><strong>AMOUNT ISSUED</strong></TableCell>
              <TableCell><strong>AMOUNT PAYABLE</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.sold.items?.map((item, index) => (
              <TableRow key={index} hover>
                <TableCell>{formatDate(item.defaultedDate)}</TableCell>
                <TableCell>{item.itemId}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.idNumber}</TableCell>
                <TableCell>{item.item}</TableCell>
                <TableCell>{item.modelNumber || 'N/A'}</TableCell>
                <TableCell sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                  {formatCurrency(item.amount)}
                </TableCell>
                <TableCell>{formatDate(item.dateSold)}</TableCell>
                <TableCell>{item.phoneNumber}</TableCell>
                <TableCell>{formatCurrency(item.amountIssued)}</TableCell>
                <TableCell>{formatCurrency(item.amountPayable)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Report 6: Balances Report
  const renderBalancesReport = () => (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Outstanding Loans</Typography>
            <Typography variant="h5" sx={{ color: '#1976D2' }}>
              {reportData.summary.totalOutstandingLoans}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Principal Issued</Typography>
            <Typography variant="h5" sx={{ color: '#F57F17' }}>
              {formatCurrency(reportData.summary.totalPrincipalIssued)}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Receivables</Typography>
            <Typography variant="h5" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
              {formatCurrency(reportData.summary.totalOutstandingReceivables)}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Interest Expected</Typography>
            <Typography variant="h5" sx={{ color: '#6A1B9A' }}>
              {formatCurrency(reportData.summary.totalInterestExpected)}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Penalties Accrued</Typography>
            <Typography variant="h5" sx={{ color: '#C62828' }}>
              {formatCurrency(reportData.summary.totalPenaltiesAccrued)}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Amount Repaid</Typography>
            <Typography variant="h5" sx={{ color: '#00695C' }}>
              {formatCurrency(reportData.summary.totalAmountRepaid)}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#4A5FE8' }}>
        Breakdown by Status
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{reportData.breakdown.byStatus.active}</Typography>
            <Typography variant="caption">Active</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{reportData.breakdown.byStatus.due}</Typography>
            <Typography variant="caption">Due</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{reportData.breakdown.byStatus.pastDue}</Typography>
            <Typography variant="caption">Past Due</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{reportData.breakdown.byStatus.defaulted}</Typography>
            <Typography variant="caption">Defaulted</Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Report 7: Expenses Report
  const renderExpensesReport = () => (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Total Expenses</Typography>
            <Typography variant="h4" sx={{ color: '#C62828' }}>
              {formatCurrency(reportData.summary.totalExpenses)}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Number of Expenses</Typography>
            <Typography variant="h4" sx={{ color: '#6A1B9A' }}>
              {reportData.summary.expenseCount}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Categories</Typography>
            <Typography variant="h4" sx={{ color: '#00695C' }}>
              {reportData.summary.categories}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.expenses?.map((expense) => (
              <TableRow key={expense.id} hover>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>
                  <Chip label={expense.category} size="small" />
                </TableCell>
                <TableCell>{expense.name}</TableCell>
                <TableCell sx={{ color: '#C62828', fontWeight: 'bold' }}>
                  {formatCurrency(expense.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Report 8: Profit & Loss Report
  const renderProfitLossReport = () => {
    const isProfitable = reportData.profitLoss.isProfitable;

    return (
      <Box>
        <Card sx={{
          p: 3,
          mb: 3,
          textAlign: 'center',
          border: isProfitable ? '2px solid #00FF9D' : '2px solid #FF4D6A'
        }}>
          <Typography variant="subtitle2" color="textSecondary">
            NET {isProfitable ? 'PROFIT' : 'LOSS'}
          </Typography>
          <Typography variant="h3" sx={{
            color: isProfitable ? '#00FF9D' : '#FF4D6A',
            fontWeight: 'bold'
          }}>
            {formatCurrency(Math.abs(reportData.profitLoss.netProfitLoss))}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Profit Margin: {reportData.profitLoss.profitMargin}%
          </Typography>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#2E7D32' }}>
                Revenue
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Interest Earned</Typography>
                <Typography variant="h6">{formatCurrency(reportData.revenue.interestEarned)}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Penalties Collected</Typography>
                <Typography variant="h6">{formatCurrency(reportData.revenue.penaltiesCollected)}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Sold Collateral</Typography>
                <Typography variant="h6">{formatCurrency(reportData.revenue.revenueFromSoldCollateral)}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" color="textSecondary">Total Revenue</Typography>
                <Typography variant="h5" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                  {formatCurrency(reportData.revenue.totalRevenue)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#C62828' }}>
                Expenses
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Total Expenses</Typography>
                <Typography variant="h6">{formatCurrency(reportData.expenses.totalExpenses)}</Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Number of Expenses</Typography>
                <Typography variant="h6">{reportData.expenses.expenseCount}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" color="textSecondary">Total Expenses</Typography>
                <Typography variant="h5" sx={{ color: '#C62828', fontWeight: 'bold' }}>
                  {formatCurrency(reportData.expenses.totalExpenses)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navigation title="Reports" />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: 4,
            fontWeight: 'bold'
          }}
        >
          Reports
        </Typography>

        {/* Date Range Selection */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Report Buttons */}
        <Grid container spacing={3}>
          {reports.map((report) => {
            // Hide admin-only reports from non-admin users
            if (report.adminOnly && user.role !== 'admin') {
              return null;
            }

            return (
              <Grid item xs={12} sm={6} md={4} key={report.key}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontWeight: 'bold' }}>
                      {report.title}
                    </Typography>
                    {report.requiresDate && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Date range required
                      </Typography>
                    )}
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => generateReport(report.key)}
                      disabled={loading}
                    >
                      {loading && reportType === report.key ? 'Generating...' : 'Generate'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Report Results */}
        {renderReportData()}
      </Container>
    </Box>
  );
};

export default Reporting;
