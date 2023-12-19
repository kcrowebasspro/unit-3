# Geog 575 Lab 2 data cleaning
library(tidyverse)
library(tidycensus)
library(stringr)
library(sf)
library(sp)
library(geojsonsf)
library(lubridate)
library(geojsonio)
library(tmap)
library(janitor)

# Data source: https://evictionlab.org/eviction-tracking/milwaukee-wi/

# Read in some data from eviction Lab
mke.evict <- read_csv("C:/Users/kcrow/Documents/geog575/unit-3/data/milwaukee_map.csv")

# Use the census API to get some median rent data for 2022
# We want ACS 5-year data 2015-2019 to match with Eviction lab's work
# Let's get the top 25 cities in the country
mke.rent.2019.sf <- get_acs(
  state = "WI",
  county = "Milwaukee",
  geography = "tract", 
  variables = "B25064_001",
  geometry = TRUE,
  year = 2019,
  survey = "acs5")

# Get the median and average rents for the county
mke.rent.2019.sf %>%
  st_drop_geometry() %>%
  summarise(med_rent = median(estimate, na.rm = TRUE),
            avg_rent = mean(estimate, na.rm = TRUE))

# med_rent avg_rent
# 873.5     913.3412

# Create new variable for the median rent
mke.rent.2019.sf <- mke.rent.2019.sf %>%
  rename(geog_name = NAME,
         med_rent = estimate) %>%
  mutate(cty_med_rent = 873.5,
         pct_med_rent = round((med_rent/cty_med_rent)*100,1))

# Create a name field just for the tract
mke.rent.2019.sf <- mke.rent.2019.sf %>%
  separate(geog_name, sep = ", ", into = c("tract_name", "county", "state"))

# clean up the names
mke.rent.2019.sf <- clean_names(mke.rent.2019.sf)

# set the ID field in the eviction lab data as character
mke.evict$id <- as.character(mke.evict$id) 


# Joint the census and the eviction lab data
mke.evict.join.sf <- mke.rent.2019.sf %>%
  inner_join(mke.evict, by = c("geoid" = "id"))

class(mke.evict.join.sf)

mke.evict.join.sf <- st_transform(mke.evict.join.sf, crs = 4326)

# write out the geojson
mkegeojson_write(mke.evict.join.sf, file = "C:/Users/kcrow/Documents/geog575/unit-3/data/mke_evictions_w_rents.geojson")

st_crs(mke.evict.join.sf)

# Write out just the attributes to a CSV
mke.evict.join.sf %>%
  st_drop_geometry() %>%
  write_csv("C:/Users/kcrow/Documents/geog575/unit-3/data/mke_evictions_w_rents_data.CSV")

# Pull some counties for Wisconsin
wi.counties.2019.sf <- get_acs(
  state = "WI",
  geography = "county", 
  variables = "B25064_001",
  geometry = TRUE,
  year = 2019,
  survey = "acs5")


# Select the MKE Metro Area
wi.counties.2019.sf %>%
  filter(grepl("washington", NAME, ignore.case = TRUE ) |
           grepl("ozaukee", NAME, ignore.case = TRUE ) |
           grepl("waukesha", NAME, ignore.case = TRUE ) |
           grepl("milwaukee", NAME, ignore.case = TRUE ) |
           grepl("racine", NAME, ignore.case = TRUE ))




