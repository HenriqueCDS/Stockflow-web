import React from 'react'

export default function Avatar({ name, size = 28 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return <span className="avatar" title={name} style={{ width: size, height: size, fontSize: size * 0.42 }}>{initial}</span>
}
