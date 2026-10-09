import React from 'react'
import StockMovePage from './StockMovePage'

export default function StockEntry({ showToast }) {
  return <StockMovePage kind="ENTRY" showToast={showToast} />
}
