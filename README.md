# Weather Oracle

A decentralized oracle service for weather data on the Stacks blockchain. This oracle enables smart contracts to access real-world weather data in a trustless manner.

## Features
- Submit weather data for specific locations
- Query weather data by location
- Verification mechanism for data providers
- Time-based data validity
- Data validation and range checking
- Emergency pause mechanism
- Provider management system

## Usage
The oracle can be used by other smart contracts to:
- Get temperature (-50°C to +50°C)
- Get humidity (0-100%)
- Get UV index (0-11)
- Get air quality index (0-500)

## Security
- Only verified data providers can submit data
- Data has expiration time (24 hours)
- Input validation for all weather metrics
- Emergency pause functionality
- Provider authorization system

## Data Validation
All submitted data must fall within accepted ranges:
- Temperature: -50°C to +50°C
- Humidity: 0-100%
- UV Index: 0-11
- Air Quality: 0-500
