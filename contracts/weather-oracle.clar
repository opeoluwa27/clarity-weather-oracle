;; Weather Oracle Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-invalid-data (err u101))
(define-constant err-stale-data (err u102))

;; Data Provider Management
(define-map data-providers principal bool)

;; Weather Data Structure
(define-map weather-data
  { location: (string-ascii 64) }
  {
    temperature: int,
    humidity: uint,
    uv-index: uint,
    air-quality: uint,
    timestamp: uint,
    provider: principal
  }
)

;; Authorization check
(define-private (is-authorized (provider principal))
  (default-to false (map-get? data-providers provider))
)

;; Add data provider
(define-public (add-provider (provider principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-unauthorized)
    (ok (map-set data-providers provider true))
  )
)

;; Submit weather data
(define-public (submit-weather-data 
  (location (string-ascii 64))
  (temperature int)
  (humidity uint)
  (uv-index uint)
  (air-quality uint))
  (let
    ((provider tx-sender))
    (asserts! (is-authorized provider) err-unauthorized)
    (ok (map-set weather-data
      { location: location }
      {
        temperature: temperature,
        humidity: humidity,
        uv-index: uv-index,
        air-quality: air-quality,
        timestamp: block-height,
        provider: provider
      }
    ))
  )
)

;; Get weather data
(define-read-only (get-weather-data (location (string-ascii 64)))
  (match (map-get? weather-data { location: location })
    data (ok data)
    err-invalid-data
  )
)

;; Check if data is fresh (within 144 blocks ~ 24 hours)
(define-read-only (is-data-fresh (location (string-ascii 64)))
  (match (map-get? weather-data { location: location })
    data (ok (< (- block-height (get timestamp data)) u144))
    err-invalid-data
  )
)
