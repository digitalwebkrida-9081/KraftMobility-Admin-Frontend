import React from 'react'
import PropTypes from 'prop-types'
import { CWidgetStatsD, CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cibFacebook, cibLinkedin, cibTwitter, cilCalendar } from '@coreui/icons'
import { CChart } from '@coreui/react-chartjs'

const WidgetsBrand = (props) => {
  const chartOptions = {
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
        hoverBorderWidth: 3,
      },
    },
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
  }

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsD
          className="mb-4 shadow-lg border-0 text-white"
          style={{
            background: 'linear-gradient(135deg, #182848 0%, #4b6cb7 100%)',
            borderRadius: '15px',
            overflow: 'hidden',
          }}
          {...(props.withCharts && {
            chart: (
              <CChart
                className="position-absolute w-100 h-100"
                type="line"
                data={{
                  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                  datasets: [
                    {
                      backgroundColor: 'rgba(255,255,255,.1)',
                      borderColor: 'rgba(255,255,255,.55)',
                      pointHoverBackgroundColor: '#fff',
                      borderWidth: 2,
                      data: [65, 59, 84, 84, 51, 55, 40],
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            ),
          })}
          icon={<CIcon icon={cibFacebook} height={52} className="my-4 text-white opacity-75" />}
          values={[
            {
              title: <span className="text-white opacity-75">friends</span>,
              value: <span className="fs-3 fw-bold text-white">89K</span>,
            },
            {
              title: <span className="text-white opacity-75">feeds</span>,
              value: <span className="fs-3 fw-bold text-white">459</span>,
            },
          ]}
        />
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsD
          className="mb-4 shadow-lg border-0 text-white"
          style={{
            background: 'linear-gradient(135deg, #1cb5e0 0%, #000851 100%)',
            borderRadius: '15px',
            overflow: 'hidden',
          }}
          {...(props.withCharts && {
            chart: (
              <CChart
                className="position-absolute w-100 h-100"
                type="line"
                data={{
                  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                  datasets: [
                    {
                      backgroundColor: 'rgba(255,255,255,.1)',
                      borderColor: 'rgba(255,255,255,.55)',
                      pointHoverBackgroundColor: '#fff',
                      borderWidth: 2,
                      data: [1, 13, 9, 17, 34, 41, 38],
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            ),
          })}
          icon={<CIcon icon={cibTwitter} height={52} className="my-4 text-white opacity-75" />}
          values={[
            {
              title: <span className="text-white opacity-75">followers</span>,
              value: <span className="fs-3 fw-bold text-white">973k</span>,
            },
            {
              title: <span className="text-white opacity-75">tweets</span>,
              value: <span className="fs-3 fw-bold text-white">1.792</span>,
            },
          ]}
        />
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsD
          className="mb-4 shadow-lg border-0 text-white"
          style={{
            background: 'linear-gradient(135deg, #09203f 0%, #537895 100%)',
            borderRadius: '15px',
            overflow: 'hidden',
          }}
          {...(props.withCharts && {
            chart: (
              <CChart
                className="position-absolute w-100 h-100"
                type="line"
                data={{
                  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                  datasets: [
                    {
                      backgroundColor: 'rgba(255,255,255,.1)',
                      borderColor: 'rgba(255,255,255,.55)',
                      pointHoverBackgroundColor: '#fff',
                      borderWidth: 2,
                      data: [78, 81, 80, 45, 34, 12, 40],
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            ),
          })}
          icon={<CIcon icon={cibLinkedin} height={52} className="my-4 text-white opacity-75" />}
          values={[
            {
              title: <span className="text-white opacity-75">contacts</span>,
              value: <span className="fs-3 fw-bold text-white">500</span>,
            },
            {
              title: <span className="text-white opacity-75">feeds</span>,
              value: <span className="fs-3 fw-bold text-white">1.292</span>,
            },
          ]}
        />
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsD
          className="mb-4 shadow-lg border-0 text-white"
          style={{
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            borderRadius: '15px',
            overflow: 'hidden',
          }}
          {...(props.withCharts && {
            chart: (
              <CChart
                className="position-absolute w-100 h-100"
                type="line"
                data={{
                  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                  datasets: [
                    {
                      backgroundColor: 'rgba(255,255,255,.1)',
                      borderColor: 'rgba(255,255,255,.55)',
                      pointHoverBackgroundColor: '#fff',
                      borderWidth: 2,
                      data: [35, 23, 56, 22, 97, 23, 64],
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            ),
          })}
          icon={<CIcon icon={cilCalendar} height={52} className="my-4 text-white opacity-75" />}
          values={[
            {
              title: <span className="text-white opacity-75">events</span>,
              value: <span className="fs-3 fw-bold text-white">12+</span>,
            },
            {
              title: <span className="text-white opacity-75">meetings</span>,
              value: <span className="fs-3 fw-bold text-white">4</span>,
            },
          ]}
        />
      </CCol>
    </CRow>
  )
}

WidgetsBrand.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsBrand
