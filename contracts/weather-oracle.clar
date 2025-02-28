;; Weather Oracle Contract

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-invalid-data (err u101))
(define-constant err-stale-data (err u102))
(define-constant err-invalid-range (err u103))
(define-constant err-contract-paused (err u104))

;; Data validation constants
(define-constant min-temperature (- 50))  ;; -50°C
(define-constant max-temperature 50)      ;; +50°C
(define-constant max-humidity u100)       ;; 100%
(define-constant max-uv-index u11)        ;; UV index scale
(define-constant max-air-quality u500)    ;; AQI scale

;; Contract status
(define-data-var contract-paused bool false)

;; Data Provider Management
(define-map data-providers 
  principal 
  {
    authorized: bool,
    reputation: uint,
    last-update: uint
  }
)

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

;; Emergency pause
(define-public (set-contract-pause (paused bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-unauthorized)
    (ok (var-set contract-paused paused))
  )
)

;; Authorization check
(define-private (is-authorized (provider principal))
  (match (map-get? data-providers provider)
    provider-data (get authorized provider-data)
    false
  )
)

;; Validate weather data
(define-private (validate-weather-data 
  (temperature int)
  (humidity uint)
  (uv-index uint)
  (air-quality uint))
  (and
    (>= temperature min-temperature)
    (<= temperature max-temperature)
    (<= humidity max-humidity)
    (<= uv-index max-uv-index)
    (<= air-quality max-air-quality)
  )
)

;; Add data provider
(define-public (add-provider (provider principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-unauthorized)
    (ok (map-set data-providers 
      provider
      {
        authorized: true,
        reputation: u0,
        last-update: u0
      }
    ))
  )
)

;; Remove data provider
(define-public (remove-provider (provider principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-unauthorized)
    (ok (map-delete data-providers provider))
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
    (asserts! (not (var-get contract-paused)) err-contract-paused)
    (asserts! (is-authorized provider) err-unauthorized)
    (asserts! (validate-weather-data temperature humidity uv-index air-quality) err-invalid-range)
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
