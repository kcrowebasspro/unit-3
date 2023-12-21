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

mke.evict.join.sf <- mke.evict.join.sf %>%
  filter(geoid != "55079990000")

st_crs(mke.evict.join.sf)


# drop the geometry
mke.evict.join.df <- mke.evict.join.sf %>%
  st_drop_geometry()

is.na()

# Get rid of NAs and Inf
mke.evict.join.df <- mke.evict.join.df %>%
  mutate(month_rate = ifelse(is.finite(month_rate), month_rate, NA)) %>%
  replace(is.na(.), 0) 

# Round the numbers
mke.evict.join.df %>%
  mutate(pct_med_rent = round(pct_med_rent, 1),
         month_rate = round(month_rate*100,1),
         month_rate_scale_max = round(month_rate_scale_max*100,1),
         month_diff = round(month_diff*100,1),
         pct_white = round(pct_white*100,1),
         pct_black = round(pct_black*100,1),
         pct_latinx = round(pct_latinx*100,1))

# Select a subset of columns to write out
mke.evict.join.df %>%
  filter(geoid != "55079990000") %>%
  select(geoid, med_rent:pct_med_rent, month_filings:pct_latinx) %>%
  write_csv("C:/Users/kcrow/Documents/geog575/unit-3/data/mke_evict.CSV")




# strip down the SF object to just have a few fields -- it needs geoid

mke.evict.join.sf <- mke.evict.join.sf %>%
  select(geoid, tract_name)

# write out the geojson
geojson_write(mke.evict.join.sf, file = "C:/Users/kcrow/Documents/geog575/unit-3/data/mke_tracts.geojson")





# Pull some counties for Wisconsin
wi.counties.2019.sf <- get_acs(
  state = "WI",
  geography = "county", 
  variables = "B25064_001",
  geometry = TRUE,
  year = 2019,
  survey = "acs5")


# Select the MKE Metro Area
mke.metro.counties <- wi.counties.2019.sf %>%
  filter(grepl("washington", NAME, ignore.case = TRUE ) |
           grepl("ozaukee", NAME, ignore.case = TRUE ) |
           grepl("waukesha", NAME, ignore.case = TRUE ) |
           grepl("milwaukee", NAME, ignore.case = TRUE ) |
           grepl("racine", NAME, ignore.case = TRUE ))

# Write that file out
geojson_write(mke.metro.counties, file = "C:/Users/kcrow/Documents/geog575/unit-3/data/metro_counties.geojson")



