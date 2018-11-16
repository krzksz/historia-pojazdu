# Historia-Pojazdu

A simple script to find out what is the valid first registration date based on data returned from [HistoriaPojazdu.gov.pl](https://historiapojazdu.gov.pl/strona-glowna).

## Why?

When looking for a new car across auction websites it is a common practice for sellers to somehow expose plate and VIN numbers along the ad. Unfortunately, in order to get a full car history report from our Polish registry, it is required to pass exact first registration date which is usually not shared. This script allows you to find out what said date is by only knowing a year (e.g. by looking into the production year).

## Getting Started

The library uses a simple brute force approach by making requests with all dates for the given year until it finds the valid one.

There are two ways of running this script on you machine which share common requirements listed below. After getting the script installed and running it, you will be asked about the plate number, VIN and a possible year of first registration.

### Prerequisites

In order to run this script you need to have software listed below installed on your machine:

-   Node.js >= 7.

### Global Package

The easiest way to use this script is to install it as a global package:

```bash
npm install -g historia-pojazdu
historia-pojazdu
```

### Cloned Repository

```bash
git clone https://github.com/krzksz/historia-pojazdu.git
cd historia-pojazdu
node ./index.js
```
