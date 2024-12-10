/* MagicMirror² Module: MMM-2Day-NOAA-Forecast
 * Version: 0.2.0
 *
 * By Jinserk Baik https://github.com/jinserk/
 * MIT Licensed.
 */

Module.register("MMM-2Day-NOAA-Forecast", {
  defaults: {
    lat: 0.0,
    lon: 0.0,
    units: "metric",
    interval: 600000 // Every 10 mins
  },

  start: function () {
    Log.log(`Starting module: ${this.name}`);

    // Set up the local values, here we construct the request url to use
    this.units = this.config.units;
    this.loaded = false;
    this.url = `https://api.weather.gov/points/${this.config.lat},${this.config.lon}`;
    this.forecast = [];

    // Trigger the first request
    this.getWeatherData(this);
  },

  getStyles: function () {
    return ["font-awesome.css", "MMM-2Day-NOAA-Forecast.css"];
  },

  getDom: function () {
    let wrapper = null;

    // If we have some data to display then build the results
    if (this.loaded) {
      // Create a wrapper for the headline (top bar)
      wrapper = document.createElement("div");
      wrapper.className = "forecast-top-bar";

      // Display the headline if available
      if (this.forecast.headline) {
        wrapper.innerHTML = `<strong>Headline:</strong> ${this.forecast.headline}`;
      } else {
        wrapper.innerHTML = "No weather alerts at the moment.";
      }
    } else {
      // If data is still loading, display a loading message
      wrapper = document.createElement("div");
      wrapper.innerHTML = "Loading ...";
    }

    return wrapper;
  },


  getWeatherData: function (_this) {
    // Make the initial request to the helper then set up the timer to perform the updates
    _this.sendSocketNotification("GET-2DAY-NOAA-FORECAST", _this.url);
    setTimeout(_this.getWeatherData, _this.config.interval, _this);
  },

  socketNotificationReceived: function (notification, payload) {
    // check to see if the response was for us and used the same url
    if (notification === "GOT-2DAY-NOAA-FORECAST" && payload.url === this.url) {
      // we got some data so set the flag, stash the data to display then request the dom update
      this.loaded = true;
      this.forecast = payload.forecast;
      //console.log(this.forecast);
      this.updateDom(1000);
    }
  },

  iconMap: {
    skc: ["sun", "moon"],
    few: ["sun", "moon"],
    sct: ["cloud-sun", "cloud-moon"],
    bkn: ["cloud-sun", "cloud-moon"],
    ovc: ["cloud", "cloud"],
    wind_skc: ["sun", "moon"],
    wind_few: ["sun", "moon"],
    wind_sct: ["cloud-sun", "cloud-moon"],
    wind_bkn: ["cloud-sun", "cloud-moon"],
    wind_ovc: ["cloud", "cloud"],
    snow: ["snowflake", "snowflake"],
    rain_snow: ["snowflake", "snowflake"],
    rain_sleet: ["snowflake", "snowflake"],
    fzra: ["snowflake", "snowflake"],
    rain_fzra: ["snowflake", "snowflake"],
    snow_fzra: ["snowflake", "snowflake"],
    sleet: ["snowflake", "snowflake"],
    rain: ["cloud-sun-rain", "cloud-moon-rain"],
    rain_showers: ["cloud-rain", "cloud-rain"],
    rain_showers_hi: ["cloud-showers-heavy", "cloud-showers-heavy"],
    tsra: ["cloud-bolt", "cloud-bolt"],
    tsra_sct: ["bolt", "bolt"],
    tsra_hi: ["bolt-lightning", "bolt-lightning"],
    tornado: ["tornado", "tornado"],
    hurricane: ["hurricane", "hurricane"],
    tropical_storm: ["hurricane", "hurricane"],
    dust: ["smog", "smog"],
    smoke: ["smog", "smog"],
    haze: ["cloud-meatball", "cloud-meatball"],
    hot: ["temperature-arrow-up", "temperature-arrow-up"],
    cold: ["temperature-arrow-down", "temperature-arrow-down"],
    blizzard: ["wind", "wind"],
    fog: ["smog", "smog"]
  },

  convertDate: function (name, isday) {
    return (
      name.split("T")[0].split("-").slice(1, 3).join("/") +
      (isday ? " Day" : " Night")
    );
  },

  convertTemp: function (temp) {
    let celsius = Math.round(((temp - 32) * 5) / 9);
    let fahrenheit = Math.round(temp);

    if (this.units === "metric") {
      return `${celsius} °C / ${fahrenheit} °F`;
    } else {
      return `${fahrenheit} °F / ${celsius} °C`;
    }
  },


  convertWindSpeed: function (wspd) {
    // convert mph -> m/s
    let converted = this.units === "metric" ? wspd.map((x) => x * 0.447) : wspd;
    let unit = this.units === "metric" ? "m/s" : "mph";

    return converted.length === 1
      ? `${Math.round(converted[0])} ${unit}`
      : `${Math.round(converted[0])}-${Math.round(converted[1])} ${unit}`;
  }
});
