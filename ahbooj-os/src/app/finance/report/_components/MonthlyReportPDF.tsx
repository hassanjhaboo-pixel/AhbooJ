'use client'

import {
  Document, Page, Text, View, StyleSheet, PDFDownloadLink
} from '@react-pdf/renderer'
import { formatTTD } from '@/lib/formatting'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    padding: 40,
    backgroundColor: '#FDFAF4',
    color: '#2C1E16',
  },
  header: {
    marginBottom: 24,
    borderBottom: '2 solid #F26419',
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#2C1E16',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#8C8177',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#F26419',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '0.5 solid rgba(44,30,22,0.1)',
  },
  statLabel: {
    fontSize: 10,
    color: '#8C8177',
  },
  statValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#2C1E16',
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(44,30,22,0.05)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: '1 solid rgba(44,30,22,0.1)',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottom: '0.5 solid rgba(44,30,22,0.07)',
  },
  col1: { flex: 3, fontSize: 9, color: '#2C1E16' },
  col2: { flex: 1.5, fontSize: 9, color: '#8C8177', textAlign: 'right' },
  col3: { flex: 1.5, fontSize: 9, color: '#2C1E16', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  colHeader: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#8C8177', textTransform: 'uppercase' },
  summaryBox: {
    backgroundColor: 'rgba(249,100,25,0.08)',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#F26419',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#8C8177',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#8C8177',
  },
})

type LedgerEntry = {
  entry_date: string
  type: string
  category: string | null
  description: string
  amount: number
}

type ReportData = {
  monthLabel: string
  income: number
  expenses: number
  net: number
  draws: number
  entries: LedgerEntry[]
  generatedAt: string
}

function ReportDocument({ data }: { data: ReportData }) {
  const income  = data.entries.filter(e => e.type === 'income')
  const expense = data.entries.filter(e => e.type === 'expense')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AhbooJ Desserts</Text>
          <Text style={styles.subtitle}>Monthly Finance Report — {data.monthLabel}</Text>
        </View>

        {/* Summary boxes */}
        <View style={styles.summaryBox}>
          {[
            { label: 'Total Income', value: formatTTD(data.income) },
            { label: 'Total Expenses', value: formatTTD(data.expenses) },
            { label: 'Net', value: formatTTD(data.net) },
            { label: 'Owner Draws', value: formatTTD(data.draws) },
          ].map(s => (
            <View key={s.label} style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Income section */}
        {income.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Income</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col1, styles.colHeader]}>Description</Text>
                <Text style={[styles.col2, styles.colHeader]}>Date</Text>
                <Text style={[styles.col3, styles.colHeader]}>Amount</Text>
              </View>
              {income.slice(0, 30).map((entry, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.col1}>{entry.description}</Text>
                  <Text style={styles.col2}>{entry.entry_date}</Text>
                  <Text style={styles.col3}>{formatTTD(entry.amount)}</Text>
                </View>
              ))}
              <View style={[styles.tableRow, { backgroundColor: 'rgba(44,30,22,0.03)' }]}>
                <Text style={[styles.col1, { fontFamily: 'Helvetica-Bold' }]}>Total Income</Text>
                <Text style={styles.col2} />
                <Text style={[styles.col3, { color: '#4CAF50' }]}>{formatTTD(data.income)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Expense section */}
        {expense.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col1, styles.colHeader]}>Description</Text>
                <Text style={[styles.col2, styles.colHeader]}>Date</Text>
                <Text style={[styles.col3, styles.colHeader]}>Amount</Text>
              </View>
              {expense.slice(0, 30).map((entry, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.col1}>{entry.description}</Text>
                  <Text style={styles.col2}>{entry.entry_date}</Text>
                  <Text style={styles.col3}>{formatTTD(entry.amount)}</Text>
                </View>
              ))}
              <View style={[styles.tableRow, { backgroundColor: 'rgba(44,30,22,0.03)' }]}>
                <Text style={[styles.col1, { fontFamily: 'Helvetica-Bold' }]}>Total Expenses</Text>
                <Text style={styles.col2} />
                <Text style={[styles.col3, { color: '#F44336' }]}>{formatTTD(data.expenses)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>AhbooJ Desserts — Confidential</Text>
          <Text style={styles.footerText}>Generated {data.generatedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}

export function MonthlyReportDownload({ data }: { data: ReportData }) {
  const filename = `AhbooJ-Report-${data.monthLabel.replace(/\s/g, '-')}.pdf`
  return (
    <PDFDownloadLink document={<ReportDocument data={data} />} fileName={filename}>
      {({ loading }) => (
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta text-white rounded-lg text-sm font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Generating PDF…' : '⬇ Download PDF Report'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
