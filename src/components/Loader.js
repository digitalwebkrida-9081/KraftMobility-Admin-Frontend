import React from 'react'
import { useSelector } from 'react-redux'

const Loader = () => {
  const loading = useSelector((state) => state.loading)

  if (!loading) return null

  return (
    <div className="global-loader-overlay">
      <div className="top-loader-bar">
        <div className="loader-progress-fill"></div>
      </div>
      <div className="loader-content">
        <div className="modern-spinner">
          <div className="spinner-inner"></div>
          <div className="spinner-inner"></div>
          <div className="spinner-glow"></div>
        </div>
        <span className="loader-text">Processing...</span>
      </div>
    </div>
  )
}

export default Loader
