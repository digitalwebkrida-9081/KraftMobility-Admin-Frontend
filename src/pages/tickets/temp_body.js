;<CModalBody className="p-3 p-md-4 bg-body-tertiary">
  {selectedTicketContent && (
    <CRow className="g-4">
      {/* Main Content Column */}
      <CCol lg={8} className="d-flex flex-column gap-4">
        {/* Header & Description Card */}
        <div className="bg-body rounded-4 shadow-sm border p-4">
          <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary d-none d-sm-block">
              <CIcon icon={cilTask} size="xl" />
            </div>
            <div>
              <h4 className="fw-bold mb-1 text-dark">{selectedTicketContent.service}</h4>
              <div className="text-muted small d-flex align-items-center gap-2">
                <CIcon icon={cilClock} size="sm" />
                <span>
                  Submitted on {new Date(selectedTicketContent.createdAt).toLocaleDateString()} at{' '}
                  {new Date(selectedTicketContent.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <CIcon icon={cilDescription} className="text-secondary" /> Ticket Description
          </h6>
          <div className="p-3 bg-body-tertiary rounded-3 border-start border-primary border-4">
            <p
              className="text-secondary mb-0"
              style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
            >
              {selectedTicketContent.description}
            </p>
          </div>
        </div>

        {/* Image Attachment Card */}
        {selectedTicketContent.image && (
          <div className="bg-body rounded-4 shadow-sm border p-4">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <CIcon icon={cilImage} className="text-secondary" /> Attached Image
            </h6>
            <div className="text-center rounded-3 p-3 bg-body-secondary border shadow-inner">
              <a
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/../${selectedTicketContent.image}`}
                target="_blank"
                rel="noopener noreferrer"
                className="d-inline-block overflow-hidden rounded-3"
                style={{ cursor: 'zoom-in', outline: 'none' }}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5656/api'}/../${selectedTicketContent.image}`}
                  alt="Ticket Attachment"
                  className="img-fluid"
                  style={{
                    maxHeight: '400px',
                    objectFit: 'contain',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </a>
            </div>
          </div>
        )}

        {/* Rating Card */}
        {selectedTicketRating && hasPermission(userRole, 'canViewRatings') && (
          <div className="bg-body rounded-4 shadow-sm border p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <CIcon icon={cilStar} className="text-warning" /> Customer Rating
              </h6>
              <div className="d-flex align-items-center gap-1 bg-warning bg-opacity-10 px-3 py-1 rounded-pill">
                <span className="fw-bold text-warning">{selectedTicketRating.rating}.0</span>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    color:
                      star <= selectedTicketRating.rating
                        ? getDetailedRatingColor(selectedTicketRating.rating)
                        : 'rgba(100,100,100,0.15)',
                    fontSize: '1.4rem',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            {selectedTicketRating.feedback && (
              <div
                className="p-3 rounded-3 bg-body-tertiary text-secondary border border-start border-warning border-4 fst-italic shadow-sm"
                style={{ fontSize: '0.95rem' }}
              >
                "{selectedTicketRating.feedback}"
              </div>
            )}
          </div>
        )}

        {/* Notes & Activity Card */}
        <div className="bg-body rounded-4 shadow-sm border p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <CIcon icon={cilList} className="text-secondary" /> Notes & Updates
            </h6>
            <span className="badge bg-secondary rounded-pill px-3 py-2">
              {currentTicketNotes.length} Note{currentTicketNotes.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div
            className="d-flex flex-column gap-3 mb-4 pe-2"
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {currentTicketNotes.length === 0 ? (
              <div className="text-center py-5 rounded-3 border border-dashed bg-body-tertiary">
                <CIcon
                  icon={cilPencil}
                  size="xxl"
                  className="text-muted opacity-25 mb-3 d-block mx-auto"
                />
                <p className="mb-0 text-muted fw-medium">
                  No updates or notes have been added yet.
                </p>
              </div>
            ) : (
              currentTicketNotes.map((note, idx) => (
                <div key={idx} className="d-flex gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm ${
                        note.author === 'Admin'
                          ? 'bg-primary'
                          : note.author === 'Operator'
                            ? 'bg-info'
                            : 'bg-secondary'
                      }`}
                      style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}
                    >
                      {getInitials(note.author)}
                    </div>
                  </div>
                  <div className="flex-grow-1 p-3 rounded-3 bg-body-tertiary border shadow-sm position-relative">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="text-dark">{note.author}</strong>
                      <small className="text-muted fw-medium" style={{ fontSize: '0.75rem' }}>
                        {new Date(note.timestamp).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </small>
                    </div>
                    <p
                      className="mb-0 text-secondary"
                      style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}
                    >
                      {note.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Note Form */}
          {hasPermission(userRole, 'canAddNotes') && (
            <CForm onSubmit={handleAddNote}>
              <div className="p-3 bg-body-tertiary border rounded-3 shadow-inner">
                <CFormLabel className="fw-bold text-dark mb-2">Post a New Update</CFormLabel>
                <CFormTextarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type progress updates, internal notes, or information here..."
                  className="bg-body border-secondary border-opacity-25 shadow-none focus-ring"
                  style={{ resize: 'vertical' }}
                />
                <div className="d-flex justify-content-end mt-3">
                  <CButton
                    type="submit"
                    color="primary"
                    disabled={!noteText.trim()}
                    className="d-flex align-items-center gap-2 px-4 shadow-sm"
                  >
                    <CIcon icon={cilPencil} size="sm" /> Submit Note
                  </CButton>
                </div>
              </div>
            </CForm>
          )}
        </div>
      </CCol>

      {/* Sidebar Column */}
      <CCol lg={4}>
        <div className="d-flex flex-column gap-4 sticky-top" style={{ zIndex: 1, top: '1rem' }}>
          {/* Status & Assignment Card */}
          <div className="bg-body rounded-4 shadow-sm border p-4">
            <h6
              className="fw-bold text-dark mb-4 text-uppercase"
              style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
            >
              Ticket Control
            </h6>

            <div className="mb-4">
              <span className="text-muted small d-block mb-2">Current Status</span>
              <span
                className={`d-inline-block px-4 py-2 rounded-3 fw-bold border shadow-sm w-100 text-center ${
                  selectedTicketContent.status === 'Completed'
                    ? 'bg-success bg-opacity-10 text-success border-success border-opacity-25'
                    : selectedTicketContent.status === 'In Progress'
                      ? 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-25'
                      : 'bg-danger bg-opacity-10 text-danger border-danger border-opacity-25'
                }`}
                style={{ fontSize: '0.95rem' }}
              >
                {selectedTicketContent.status}
              </span>
            </div>

            <div className="mb-4">
              <span className="text-muted small d-block mb-2">Internal ID</span>
              <div className="d-flex align-items-center gap-2 bg-body-tertiary px-3 py-2 rounded-3 border">
                <CIcon icon={cilGrid} className="text-secondary" />
                <span className="fw-semibold text-dark font-monospace">
                  #{selectedTicketContent.id}
                </span>
              </div>
            </div>

            {selectedTicketContent.assignedToName && (
              <div>
                <span className="text-muted small d-block mb-2">Assigned Operator</span>
                <div className="d-flex align-items-center gap-3 p-2 bg-body-tertiary rounded-3 border">
                  <div
                    className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                    style={{ width: '36px', height: '36px' }}
                  >
                    {getInitials(selectedTicketContent.assignedToName)}
                  </div>
                  <span className="fw-bold text-dark">{selectedTicketContent.assignedToName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer Details Card (Only for authorized roles) */}
          {['Admin', 'Operator', 'HR'].includes(userRole) && selectedTicketContent.userDetails && (
            <div className="bg-body rounded-4 shadow-sm border p-0 overflow-hidden">
              <div className="bg-primary bg-opacity-10 p-3 border-bottom border-primary border-opacity-25">
                <h6
                  className="fw-bold text-primary mb-0 d-flex align-items-center gap-2 text-uppercase"
                  style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
                >
                  <CIcon icon={cilUser} /> Customer Overview
                </h6>
              </div>

              <div className="p-4 d-flex flex-column gap-3">
                <div>
                  <span className="text-muted small fw-medium d-block mb-1">Full Name</span>
                  <strong className="text-dark fs-6">
                    {selectedTicketContent.userDetails.username || 'N/A'}
                  </strong>
                </div>

                <div>
                  <span className="text-muted small fw-medium d-block mb-1">Phone Number</span>
                  <div className="d-flex align-items-center gap-2">
                    <strong className="text-dark">
                      {selectedTicketContent.userDetails.phoneNumber || 'N/A'}
                    </strong>
                  </div>
                </div>

                <div>
                  <span className="text-muted small fw-medium d-block mb-1">Email Address</span>
                  <a
                    href={`mailto:${selectedTicketContent.userDetails.email || selectedTicketContent.userEmail}`}
                    className="text-decoration-none fw-medium text-primary text-break"
                  >
                    {selectedTicketContent.userDetails.email ||
                      selectedTicketContent.userEmail ||
                      'N/A'}
                  </a>
                </div>

                <div className="p-3 bg-body-tertiary rounded-3 border mt-2">
                  <span
                    className="text-muted small fw-bold text-uppercase d-block mb-2"
                    style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}
                  >
                    Service Location
                  </span>

                  {selectedTicketContent.userDetails.propertyAddress ? (
                    <p className="text-dark fw-medium mb-0 small lh-sm">
                      {selectedTicketContent.userDetails.propertyAddress}
                    </p>
                  ) : selectedTicketContent.userDetails.location ? (
                    <p className="text-dark fw-medium mb-0 small lh-sm">
                      {selectedTicketContent.userDetails.location}
                    </p>
                  ) : (
                    <span className="text-muted fst-italic small">No address provided</span>
                  )}

                  {selectedTicketContent.userDetails.location &&
                    selectedTicketContent.userDetails.propertyAddress && (
                      <div className="mt-2 pt-2 border-top border-secondary border-opacity-25">
                        <span className="text-muted small fw-medium d-block mb-1">City / Area</span>
                        <span className="text-dark fw-medium small">
                          {selectedTicketContent.userDetails.location}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CCol>
    </CRow>
  )}
</CModalBody>
