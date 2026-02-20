import React, { useState } from 'react'
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormTextarea,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilStar } from '@coreui/icons'

const RatingModal = ({ visible, onClose, onSubmit, ticketId }) => {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [hover, setHover] = useState(0)

  const handleSubmit = () => {
    onSubmit(ticketId, rating, feedback)
    // Reset state after submit
    setRating(0)
    setFeedback('')
    setHover(0)
  }

  const getStarColor = (value) => {
    if (value >= 4) return '#10b981' // Green
    if (value === 3) return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  const currentColor = getStarColor(hover || rating)

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader onClose={onClose} className="border-0 pb-0">
        <CModalTitle className="fw-bold w-100 text-center">Rate Your Experience</CModalTitle>
      </CModalHeader>
      <CModalBody className="pt-0">
        <div className="text-center mb-4">
          <p className="text-muted small">How was the service provided?</p>
          <div className="d-flex justify-content-center gap-2 mb-3">
            {[...Array(5)].map((star, index) => {
              const ratingValue = index + 1
              return (
                <CIcon
                  key={index}
                  icon={cilStar}
                  size="3xl"
                  style={{
                    cursor: 'pointer',
                    color: ratingValue <= (hover || rating) ? currentColor : '#e5e7eb',
                    transition: 'color 0.2s ease-in-out, transform 0.1s',
                    transform: ratingValue <= (hover || rating) ? 'scale(1.1)' : 'scale(1)',
                  }}
                  onClick={() => setRating(ratingValue)}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                />
              )
            })}
          </div>
          <div className="fw-bold" style={{ color: currentColor, minHeight: '24px' }}>
            {hover === 1 && 'Poor'}
            {hover === 2 && 'Fair'}
            {hover === 3 && 'Good'}
            {hover === 4 && 'Very Good'}
            {hover === 5 && 'Excellent'}
            {!hover && rating > 0 && (
              <>
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </>
            )}
          </div>
        </div>

        <CForm>
          <div className="mb-3">
            <CFormLabel className="fw-semibold">Feedback (Optional)</CFormLabel>
            <CFormTextarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="bg-light border-0"
              style={{ resize: 'none', color: '#000' }}
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter className="border-0 pt-0 d-flex justify-content-center pb-4">
        <CButton color="secondary" variant="ghost" onClick={onClose} className="px-4 rounded-pill">
          Cancel
        </CButton>
        <CButton
          style={{
            backgroundColor: rating > 0 ? currentColor : '#e5e7eb',
            borderColor: rating > 0 ? currentColor : '#e5e7eb',
            color: rating > 0 ? '#fff' : '#9ca3af',
          }}
          onClick={handleSubmit}
          disabled={rating === 0}
          className="px-5 rounded-pill fw-bold"
        >
          Submit Rating
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default RatingModal
