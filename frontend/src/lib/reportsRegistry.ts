import React from 'react';

export type ReportConfig = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  apiEndpoint: string;
  exportKey: string;
  columns: { key: string; label: string; render?: (v: any, row: any) => React.ReactNode }[];
  filters: {
    showDateRange?: boolean;
    showAcademicYear?: boolean;
    showClassSection?: boolean;
    showStatus?: boolean;
    statusOptions?: { value: string; label: string }[];
    showAdSource?: boolean;
    showPaymentMode?: boolean;
    showVendor?: boolean;
    showExpenseCategory?: boolean;
  };
};

export type ReportCategory = {
  id: string;
  title: string;
  reports: ReportConfig[];
};

export const reportsRegistry: ReportCategory[] = [
  {
    id: 'admit',
    title: 'Admit',
    reports: [
      {
        id: 'applicants',
        categoryId: 'admit',
        title: 'Applicants',
        description: 'List of applicants by status, class or ad source',
        apiEndpoint: '/reports/admit/applicants/',
        exportKey: 'ADMIT_APPLICANTS',
        filters: { showDateRange: true, showAcademicYear: true, showClassSection: true, showStatus: true, statusOptions: [
          { value: 'ENQUIRY', label: 'Enquiry' },
          { value: 'APPLIED', label: 'Applied' },
          { value: 'ADMITTED', label: 'Admitted' },
          { value: 'REJECTED', label: 'Rejected' },
        ], showAdSource: true },
        columns: [
          { key: 'application_number', label: 'App No.' },
          { key: 'student_name', label: 'Applicant Name' },
          { key: 'grade', label: 'Applied For' },
          { key: 'ad_source', label: 'Source' },
          { key: 'status', label: 'Status' }
        ]
      },
      {
        id: 'fee-allocations',
        categoryId: 'admit',
        title: 'Applicants Fee Allocations',
        description: 'List of applicants by status, class or ad source and By Fee Allocations',
        apiEndpoint: '/reports/admit/fee-allocations/',
        exportKey: 'ADMIT_FEE_ALLOCATIONS',
        filters: { showDateRange: true, showAcademicYear: true, showClassSection: true, showAdSource: true },
        columns: [
          { key: 'application_number', label: 'App No.' },
          { key: 'student_name', label: 'Applicant Name' },
          { key: 'total_fee', label: 'Allocated Fee' },
          { key: 'status', label: 'Status' }
        ]
      },
      {
        id: 'counts-by-class',
        categoryId: 'admit',
        title: 'Applicant counts by class',
        description: 'Class wise applicant counts in different status',
        apiEndpoint: '/reports/admit/counts-by-class/',
        exportKey: 'ADMIT_COUNTS_BY_CLASS',
        filters: { showDateRange: true, showAcademicYear: true, showClassSection: false },
        columns: [
          { key: 'class_name', label: 'Class/Grade' },
          { key: 'enquiry_count', label: 'Enquiry' },
          { key: 'applied_count', label: 'Applied' },
          { key: 'admitted_count', label: 'Admitted' }
        ]
      },
      {
        id: 'counts-by-month',
        categoryId: 'admit',
        title: 'Applicant counts by month',
        description: 'Month wise applicant counts in different admission steps',
        apiEndpoint: '/reports/admit/counts-by-month/',
        exportKey: 'ADMIT_COUNTS_BY_MONTH',
        filters: { showDateRange: true, showAcademicYear: true, showClassSection: true },
        columns: [
          { key: 'month', label: 'Month' },
          { key: 'total_applications', label: 'Total Applications' },
          { key: 'admitted', label: 'Admitted' }
        ]
      }
    ]
  },
  {
    id: 'academics',
    title: 'Academics',
    reports: [
      {
        id: 'students',
        categoryId: 'academics',
        title: 'Students',
        description: 'List of students by class',
        apiEndpoint: '/reports/academics/students/',
        exportKey: 'ACADEMICS_STUDENTS',
        filters: { showDateRange: false, showClassSection: true },
        columns: [
          { key: 'admission_number', label: 'Admission No.' },
          { key: 'name', label: 'Student Name' },
          { key: 'grade', label: 'Grade' }
        ]
      },
      {
        id: 'notes',
        categoryId: 'academics',
        title: 'Student notes',
        description: 'View student notes',
        apiEndpoint: '/reports/academics/notes/',
        exportKey: 'ACADEMICS_NOTES',
        filters: { showDateRange: true, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'strength',
        categoryId: 'academics',
        title: 'Student strength',
        description: 'Counts of students in a class or section by gender, category',
        apiEndpoint: '/reports/academics/strength/',
        exportKey: 'ACADEMICS_STRENGTH',
        filters: { showDateRange: false, showClassSection: true },
        columns: [
          { key: 'grade', label: 'Grade/Section' },
          { key: 'total', label: 'Total Strength' },
          { key: 'boys', label: 'Boys' },
          { key: 'girls', label: 'Girls' }
        ]
      },
      {
        id: 'attendance',
        categoryId: 'academics',
        title: 'Student attendance',
        description: 'View attendance for students by day up to a month',
        apiEndpoint: '/reports/academics/attendance/',
        exportKey: 'ACADEMICS_ATTENDANCE',
        filters: { showDateRange: true, showClassSection: true },
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'present', label: 'Present' },
          { key: 'absent', label: 'Absent' },
          { key: 'late', label: 'Late' }
        ]
      },
      {
        id: 'hall-tickets',
        categoryId: 'academics',
        title: 'Hall tickets',
        description: 'Bulk download hall tickets for an exam',
        apiEndpoint: '/reports/academics/hall-tickets/',
        exportKey: 'ACADEMICS_HALL_TICKETS',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'consolidated-marks',
        categoryId: 'academics',
        title: 'Consolidated marks sheet',
        description: 'Marks report for all students of a section',
        apiEndpoint: '/reports/academics/consolidated-marks/',
        exportKey: 'ACADEMICS_CONSOLIDATED_MARKS',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'section-report-cards',
        categoryId: 'academics',
        title: 'Sectionwise report cards',
        description: 'Bulk download report cards for all students of a section',
        apiEndpoint: '/reports/academics/section-report-cards/',
        exportKey: 'ACADEMICS_SECTION_REPORT_CARDS',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'section-report-cards-summary',
        categoryId: 'academics',
        title: 'Students Sectionwise report cards Summary',
        description: 'Bulk download report cards Summary for all students of a section',
        apiEndpoint: '/reports/academics/section-report-cards-summary/',
        exportKey: 'ACADEMICS_SECTION_REPORT_CARDS_SUMMARY',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'ranks',
        categoryId: 'academics',
        title: 'Student ranks',
        description: 'Student ranks in a section and class by marks for cumulative and each subject',
        apiEndpoint: '/reports/academics/ranks/',
        exportKey: 'ACADEMICS_RANKS',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'missing-parent-app',
        categoryId: 'academics',
        title: 'Missing parent app registrations',
        description: 'List of parents that did not log into parent app',
        apiEndpoint: '/reports/academics/missing-parent-app/',
        exportKey: 'ACADEMICS_MISSING_PARENT_APP',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'id-cards',
        categoryId: 'academics',
        title: 'Student ID Cards',
        description: 'Printable student ID cards',
        apiEndpoint: '/reports/academics/id-cards/',
        exportKey: 'ACADEMICS_ID_CARDS',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      }
    ]
  },
  {
    id: 'payments',
    title: 'Payments',
    reports: [
      {
        id: 'fee-balances',
        categoryId: 'payments',
        title: 'Fee balances',
        description: 'Various ways to filter teh fee balances',
        apiEndpoint: '/reports/payments/fee-balances/',
        exportKey: 'PAYMENTS_FEE_BALANCES',
        filters: { showDateRange: false, showClassSection: true },
        columns: [
          { key: 'invoice_number', label: 'Invoice No.' },
          { key: 'student', label: 'Student' },
          { key: 'net_amount', label: 'Net Amount' },
          { key: 'paid_amount', label: 'Paid Amount' },
          { key: 'outstanding_amount', label: 'Balance' }
        ]
      },
      {
        id: 'fee-balances-teachers',
        categoryId: 'payments',
        title: 'Fee balances For Teachers',
        description: 'Various ways to filter teh fee balances for teachers',
        apiEndpoint: '/reports/payments/fee-balances-teachers/',
        exportKey: 'PAYMENTS_FEE_BALANCES_TEACHERS',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'daily-collections',
        categoryId: 'payments',
        title: 'Daily Collections',
        description: 'Various ways to filter teh fee balances for teachers',
        apiEndpoint: '/reports/payments/daily-collections/',
        exportKey: 'PAYMENTS_DAILY_COLLECTIONS',
        filters: { showDateRange: true, showClassSection: false, showPaymentMode: true },
        columns: [
          { key: 'receipt_number', label: 'Receipt No.' },
          { key: 'student', label: 'Student' },
          { key: 'amount', label: 'Amount' },
          { key: 'payment_mode', label: 'Mode' },
          { key: 'payment_date', label: 'Date' }
        ]
      },
      {
        id: 'receipts',
        categoryId: 'payments',
        title: 'Receipts',
        description: 'List of receipts for a date range by collection account and fee type',
        apiEndpoint: '/reports/payments/receipts/',
        exportKey: 'PAYMENTS_RECEIPTS',
        filters: { showDateRange: true, showClassSection: false, showPaymentMode: true },
        columns: [
          { key: 'receipt_number', label: 'Receipt No.' },
          { key: 'amount', label: 'Amount' },
          { key: 'payment_mode', label: 'Mode' },
          { key: 'payment_date', label: 'Date' },
          { key: 'status', label: 'Status' }
        ]
      },
      {
        id: 'deleted-receipts',
        categoryId: 'payments',
        title: 'Deleted Receipts',
        description: 'List of deleted receipts for a date range',
        apiEndpoint: '/reports/payments/deleted-receipts/',
        exportKey: 'PAYMENTS_DELETED_RECEIPTS',
        filters: { showDateRange: true, showClassSection: false },
        columns: [
          { key: 'receipt_number', label: 'Receipt No.' },
          { key: 'amount', label: 'Amount' },
          { key: 'status', label: 'Status' }
        ]
      },
      {
        id: 'other-income',
        categoryId: 'payments',
        title: 'Other Income Receipts',
        description: 'List of Other Income receipts for a date range',
        apiEndpoint: '/reports/payments/other-income/',
        exportKey: 'PAYMENTS_OTHER_INCOME',
        filters: { showDateRange: true, showClassSection: false },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'deleted-other-income',
        categoryId: 'payments',
        title: 'Deleted Other Income Receipts',
        description: 'List of Deleted Other Income receipts for a date range',
        apiEndpoint: '/reports/payments/deleted-other-income/',
        exportKey: 'PAYMENTS_DELETED_OTHER_INCOME',
        filters: { showDateRange: true, showClassSection: false },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'cheques',
        categoryId: 'payments',
        title: 'Cheques',
        description: 'List of cheques received for a given date range',
        apiEndpoint: '/reports/payments/cheques/',
        exportKey: 'PAYMENTS_CHEQUES',
        filters: { showDateRange: true, showClassSection: false, showPaymentMode: false },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'concessions',
        categoryId: 'payments',
        title: 'Concessions',
        description: 'List of Concessions for a given date range',
        apiEndpoint: '/reports/payments/concessions/',
        exportKey: 'PAYMENTS_CONCESSIONS',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'fees-paid',
        categoryId: 'payments',
        title: 'Fees paid',
        description: 'Fees paid reports',
        apiEndpoint: '/reports/payments/fees-paid/',
        exportKey: 'PAYMENTS_FEES_PAID',
        filters: { showDateRange: true, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'bank-transactions',
        categoryId: 'payments',
        title: 'Bank transactions',
        description: 'Bank transactions reports',
        apiEndpoint: '/reports/payments/bank-transactions/',
        exportKey: 'PAYMENTS_BANK_TRANSACTIONS',
        filters: { showDateRange: true, showClassSection: false },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'income-statement',
        categoryId: 'payments',
        title: 'Income statement',
        description: 'Income statement for given date range',
        apiEndpoint: '/reports/payments/income-statement/',
        exportKey: 'PAYMENTS_INCOME_STATEMENT',
        filters: { showDateRange: true, showClassSection: false },
        columns: [
          { key: 'category', label: 'Category' },
          { key: 'total', label: 'Total Amount' }
        ]
      },
      {
        id: 'expenses',
        categoryId: 'payments',
        title: 'Expenses',
        description: 'List of Expenses for a date range by vendor, category',
        apiEndpoint: '/reports/payments/expenses/',
        exportKey: 'PAYMENTS_EXPENSES',
        filters: { showDateRange: true, showClassSection: false, showVendor: true, showExpenseCategory: true },
        columns: [
          { key: 'title', label: 'Title' },
          { key: 'category__name', label: 'Category' },
          { key: 'amount', label: 'Amount' },
          { key: 'expense_date', label: 'Date' }
        ]
      },
      {
        id: 'bus-expenses',
        categoryId: 'payments',
        title: 'Bus Expenses',
        description: 'List of Bus Expenses for a date range',
        apiEndpoint: '/reports/payments/bus-expenses/',
        exportKey: 'PAYMENTS_BUS_EXPENSES',
        filters: { showDateRange: true, showClassSection: false, showVendor: true, showExpenseCategory: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'fee-balances-no-concession',
        categoryId: 'payments',
        title: 'Fee balances Without Concession',
        description: 'Fee balances Without Concession',
        apiEndpoint: '/reports/payments/fee-balances-no-concession/',
        exportKey: 'PAYMENTS_FEE_BALANCES_NO_CONCESSION',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'all-receipts',
        categoryId: 'payments',
        title: 'All Receipts',
        description: 'List of all receipts',
        apiEndpoint: '/reports/payments/all-receipts/',
        exportKey: 'PAYMENTS_ALL_RECEIPTS',
        filters: { showDateRange: true, showClassSection: false, showPaymentMode: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'all-receipts-with-mismatch',
        categoryId: 'payments',
        title: 'All Receipts with Mismatch',
        description: 'List of receipts with mismatch',
        apiEndpoint: '/reports/payments/all-receipts-with-mismatch/',
        exportKey: 'PAYMENTS_ALL_RECEIPTS_WITH_MISMATCH',
        filters: { showDateRange: true, showClassSection: false, showPaymentMode: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'all-income-expenses',
        categoryId: 'payments',
        title: 'All Income And Expenses',
        description: 'List of All Income And Expenses',
        apiEndpoint: '/reports/payments/all-income-expenses/',
        exportKey: 'PAYMENTS_ALL_INCOME_EXPENSES',
        filters: { showDateRange: true, showClassSection: false },
        columns: [{ key: 'message', label: 'Feature Status' }]
      },
      {
        id: 'student-detailed-balances',
        categoryId: 'payments',
        title: 'Student Detailed balances',
        description: 'Student Detailed balances report',
        apiEndpoint: '/reports/payments/student-detailed-balances/',
        exportKey: 'PAYMENTS_STUDENT_DETAILED_BALANCES',
        filters: { showDateRange: false, showClassSection: true },
        columns: [{ key: 'message', label: 'Feature Status' }]
      }
    ]
  },
  {
    id: 'staff',
    title: 'Staff & HR',
    reports: [
      {
        id: 'attendance',
        categoryId: 'staff',
        title: 'Staff Attendance',
        description: 'Teacher and staff attendance and records',
        apiEndpoint: '/reports/staff/attendance/',
        exportKey: 'STAFF_ATTENDANCE',
        filters: { showDateRange: true, showClassSection: false, showAcademicYear: false },
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'staff_id', label: 'Employee ID' },
          { key: 'status', label: 'Attendance Status' }
        ]
      }
    ]
  },
  {
    id: 'bus',
    title: 'Transport',
    reports: [
      {
        id: 'bus-fee-balances',
        categoryId: 'bus',
        title: 'Students With bus fees balances',
        description: 'Bus allocations and fee balances',
        apiEndpoint: '/reports/bus/bus-fee-balances/',
        exportKey: 'BUS_FEE_BALANCES',
        filters: { showDateRange: false, showClassSection: true },
        columns: [
          { key: 'invoice_number', label: 'Invoice No.' },
          { key: 'outstanding_amount', label: 'Balance' },
          { key: 'due_date', label: 'Due Date' }
        ]
      }
    ]
  },
  {
    id: 'past-dues',
    title: 'Past Dues & Aging',
    reports: [
      {
        id: 'list',
        categoryId: 'past-dues',
        title: 'Students With Past Due fees',
        description: 'View students with overdue fee balances',
        apiEndpoint: '/reports/past-dues/list/',
        exportKey: 'PAST_DUES_LIST',
        filters: { showDateRange: false, showClassSection: true },
        columns: [
          { key: 'invoice_number', label: 'Invoice No.' },
          { key: 'outstanding_amount', label: 'Balance' },
          { key: 'due_date', label: 'Due Date' },
          { key: 'days_overdue', label: 'Days Overdue' }
        ]
      }
    ]
  }
];

export const getReportConfig = (categoryId: string, reportId: string): ReportConfig | undefined => {
  const category = reportsRegistry.find(c => c.id === categoryId);
  return category?.reports.find(r => r.id === reportId);
};
