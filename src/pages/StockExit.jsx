import React from 'react'
import StockMovePage from './StockMovePage'

export default function StockExit({ showToast }) {
  return <StockMovePage kind="EXIT" showToast={showToast} />
}
