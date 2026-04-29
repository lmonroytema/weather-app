import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_LOCATION = {
  lat: 40.4168,
  lon: -3.7038,
  label: "Madrid, España",
};

function weatherCodeToType(code) {
  if (code === 0) return "sunny";
  if (code >= 1 && code <= 3) return "cloudy";
  if (code >= 45 && code <= 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 95 && code <= 99) return "storm";
  return "cloudy";
}

function weatherCodeToText(code) {
  if (code === 0) return "Despejado";
  if (code === 1) return "Mayormente despejado";
  if (code === 2) return "Parcialmente nublado";
  if (code === 3) return "Cubierto";
  if (code >= 45 && code <= 48) return "Niebla";
  if (code >= 51 && code <= 55) return "Llovizna";
  if (code >= 56 && code <= 57) return "Llovizna helada";
  if (code >= 61 && code <= 65) return "Lluvia";
  if (code >= 66 && code <= 67) return "Lluvia helada";
  if (code >= 71 && code <= 77) return "Nieve";
  if (code >= 80 && code <= 82) return "Chubascos";
  if (code >= 95 && code <= 99) return "Tormenta";
  return "Condición variable";
}

function degToCompass(deg = 0) {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round(((deg % 360) / 45)) % 8;
  return dirs[index];
}

function formatPlaceName(geo) {
  if (!geo) return null;
  const a = geo.address || {};
  const city = a.city || a.town || a.village || a.hamlet || a.county;
  const state = a.state || a.region;
  const country = a.country;
  const parts = [city, state, country].filter(Boolean);
  return parts.length ? parts.join(", ") : geo.display_name || null;
}

function getHourlyToday(weather) {
  if (!weather?.hourly?.time || !weather?.hourly?.temperature_2m) return [];
  const times = weather.hourly.time;
  const temps = weather.hourly.temperature_2m;
  const currentTime = weather.current?.time;
  let start = 0;

  if (currentTime) {
    const idx = times.findIndex((t) => t === currentTime);
    if (idx >= 0) start = idx;
  }

  return times.slice(start, start + 24).map((t, i) => ({
    time: t,
    hour: new Date(t).getHours(),
    temp: temps[start + i],
  }));
}

function WeatherIcon({ code, size = 120 }) {
  const type = weatherCodeToType(code);

  if (type === "sunny") {
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} className="weather-svg">
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FFD24A" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFD24A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="42" fill="url(#sunGlow)" opacity="0.45" />
        <g className="spin-slow" transform="translate(60 60)">
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="0"
              y1="-36"
              x2="0"
              y2="-50"
              stroke="#FFD24A"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${i * 30})`}
            />
          ))}
        </g>
        <circle cx="60" cy="60" r="24" fill="#FFD24A" />
      </svg>
    );
  }

  if (type === "fog") {
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} className="weather-svg">
        <g stroke="#B9E4FF" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9">
          {[38, 54, 70, 86].map((y, i) => (
            <g key={y}>
              <line x1="20" y1={y} x2="100" y2={y}>
                <animate
                  attributeName="x1"
                  values="20;25;20"
                  dur={`${3 + i * 0.4}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="x2"
                  values="100;95;100"
                  dur={`${3 + i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </line>
            </g>
          ))}
        </g>
      </svg>
    );
  }

  if (type === "rain") {
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} className="weather-svg">
        <g>
          <ellipse cx="52" cy="48" rx="30" ry="18" fill="#D6EEFF" />
          <ellipse cx="75" cy="52" rx="22" ry="14" fill="#C5E6FF" />
          <ellipse cx="36" cy="56" rx="20" ry="12" fill="#BBDFFF" />
        </g>
        <g fill="#00C2FF">
          {[38, 54, 70, 86].map((x, i) => (
            <path
              key={x}
              d={`M${x} 72 C${x - 2} 77, ${x + 2} 83, ${x} 88 C${x - 2} 83, ${x + 2} 77, ${x} 72 Z`}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 16; 0 0"
                dur={`${1.2 + i * 0.2}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.4;1"
                dur={`${1.2 + i * 0.2}s`}
                repeatCount="indefinite"
              />
            </path>
          ))}
        </g>
      </svg>
    );
  }

  if (type === "snow") {
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} className="weather-svg">
        <g>
          <ellipse cx="52" cy="48" rx="30" ry="18" fill="#D6EEFF" />
          <ellipse cx="75" cy="52" rx="22" ry="14" fill="#C5E6FF" />
          <ellipse cx="36" cy="56" rx="20" ry="12" fill="#BBDFFF" />
        </g>
        <g fill="#E8F8FF">
          {[40, 54, 68, 82].map((x, i) => (
            <g key={x} transform={`translate(${x} 82)`}>
              <circle r="3">
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur={`${1.4 + i * 0.15}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </g>
      </svg>
    );
  }

  if (type === "storm") {
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} className="weather-svg">
        <g>
          <ellipse cx="52" cy="48" rx="30" ry="18" fill="#D6EEFF" />
          <ellipse cx="75" cy="52" rx="22" ry="14" fill="#C5E6FF" />
          <ellipse cx="36" cy="56" rx="20" ry="12" fill="#BBDFFF" />
        </g>
        <polygon points="62,66 49,90 61,90 53,108 78,80 64,80 72,66" fill="#FFE266">
          <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
        </polygon>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="weather-svg">
      <g>
        <ellipse cx="52" cy="48" rx="30" ry="18" fill="#D6EEFF">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 2 0; 0 0"
            dur="4s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="75" cy="52" rx="22" ry="14" fill="#C5E6FF">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; -2 0; 0 0"
            dur="3.5s"
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse cx="36" cy="56" rx="20" ry="12" fill="#BBDFFF">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 1 0; 0 0"
            dur="4.5s"
            repeatCount="indefinite"
          />
        </ellipse>
      </g>
    </svg>
  );
}

function DailyForecast({ daily }) {
  if (!daily?.time?.length) return null;
  return (
    <div className="daily-row">
      {daily.time.slice(0, 7).map((day, i) => {
        const code = daily.weather_code?.[i];
        const tMax = daily.temperature_2m_max?.[i];
        const tMin = daily.temperature_2m_min?.[i];
        return (
          <div className="daily-card" key={day}>
            <div className="label tiny">
              {new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(new Date(day))}
            </div>
            <div className="daily-icon-wrap">
              <WeatherIcon code={code} size={38} />
            </div>
            <div className="daily-temp">
              {Math.round(tMax)}° / {Math.round(tMin)}°
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HourlyChart({ hourly }) {
  if (!hourly?.length) return null;
  const width = 720;
  const height = 180;
  const padding = 24;
  const temps = hourly.map((h) => h.temp);
  const min = Math.min(...temps) - 1;
  const max = Math.max(...temps) + 1;
  const step = (width - padding * 2) / Math.max(1, hourly.length - 1);

  const points = hourly.map((h, i) => {
    const x = padding + i * step;
    const ratio = (h.temp - min) / (max - min || 1);
    const y = height - padding - ratio * (height - padding * 2);
    return { x, y, ...h };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `M ${points[0].x} ${height - padding} L ${polyline.replaceAll(",", " ")} L ${
    points[points.length - 1].x
  } ${height - padding} Z`;

  return (
    <div className="card chart-card fade-in">
      <div className="label">TEMPERATURA HOY</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,194,255,0.40)" />
            <stop offset="100%" stopColor="rgba(0,194,255,0.02)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => {
          const y = padding + ((height - padding * 2) * i) / 3;
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(180,210,255,0.12)"
              strokeWidth="1"
            />
          );
        })}

        <path d={area} fill="url(#lineFill)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="#00C2FF"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <g key={i}>
            {i % 3 === 0 && (
              <>
                <text
                  x={p.x}
                  y={height - 6}
                  textAnchor="middle"
                  fill="rgba(200,220,255,0.75)"
                  fontSize="11"
                  fontFamily="'DM Sans', sans-serif"
                >
                  {String(p.hour).padStart(2, "0")}:00
                </text>
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fill="#AEE9FF"
                  fontSize="11"
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  {Math.round(p.temp)}°
                </text>
              </>
            )}
            <circle cx={p.x} cy={p.y} r="2.2" fill="#00C2FF" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function LoadingOverlay({ show }) {
  if (!show) return null;
  return (
    <div className="loading-overlay">
      <div className="loading-glass">
        <div className="spinner" />
        <span>Cargando clima...</span>
      </div>
    </div>
  );
}

function WeatherMap({ center, onSelectLocation }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(!!window.L);
  const [mapError, setMapError] = useState("");

  const setMarker = useCallback((lat, lon) => {
    if (!mapRef.current || !window.L) return;
    const icon = window.L.divIcon({
      className: "pulse-marker-wrapper",
      html: `<div class="pulse-marker"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = window.L.marker([lat, lon], { icon }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const cssId = "leaflet-css-cdn";
    const jsId = "leaflet-js-cdn";

    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    let script = document.getElementById(jsId);
    if (!script) {
      script = document.createElement("script");
      script.id = jsId;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const onLoad = () => setLeafletReady(true);
    const onError = () => setMapError("No se pudo cargar Leaflet desde CDN.");
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    return () => {
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (!leafletReady || mapRef.current || !window.L) return;

    const map = window.L.map("map", { zoomControl: true, attributionControl: false }).setView(
      [center.lat, center.lon],
      7
    );

    window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setMarker(lat, lng);
      onSelectLocation(lat, lng);
    });

    mapRef.current = map;
    setMarker(center.lat, center.lon);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [leafletReady, center.lat, center.lon, onSelectLocation, setMarker]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([center.lat, center.lon], mapRef.current.getZoom(), {
      animate: true,
      duration: 0.75,
    });
    setMarker(center.lat, center.lon);
  }, [center.lat, center.lon, setMarker]);

  return (
    <div className="map-wrap">
      {mapError && <div className="map-error">{mapError}</div>}
      <div id="map" />
    </div>
  );
}

function WeatherPanel({ weather, place, coords, loading, error }) {
  const hourly = useMemo(() => getHourlyToday(weather), [weather]);
  const current = weather?.current || {};
  const weatherText = weatherCodeToText(current.weather_code);

  return (
    <section className="panel-wrap">
      <LoadingOverlay show={loading && !weather} />
      {loading && <div className="top-loader" />}

      <div className={`panel-inner ${weather ? "fade-in" : ""}`}>
        <div className="header-row">
          <div>
            <div className="label">UBICACIÓN</div>
            <h1 className="place">{place || "Selecciona un punto en el mapa"}</h1>
            <div className="coords">
              {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
            </div>
          </div>
          <div className="hero-icon">{weather ? <WeatherIcon code={current.weather_code} size={110} /> : null}</div>
        </div>

        {error && <div className="error-card">{error}</div>}

        {weather && (
          <>
            <div className="hero-temp card">
              <div className="hero-glow" />
              <div className="label">AHORA</div>
              <div className="temp-main">
                {Math.round(current.temperature_2m)}
                <span>°C</span>
              </div>
              <div className="weather-text">{weatherText}</div>
            </div>

            <div className="stats-grid">
              <div className="card stat">
                <div className="label tiny">Sensación térmica</div>
                <div className="value">{Math.round(current.apparent_temperature)}°C</div>
              </div>
              <div className="card stat">
                <div className="label tiny">Humedad</div>
                <div className="value">{Math.round(current.relative_humidity_2m)}%</div>
              </div>
              <div className="card stat">
                <div className="label tiny">Viento</div>
                <div className="value">
                  {Math.round(current.wind_speed_10m)} km/h {degToCompass(current.wind_direction_10m)}
                </div>
              </div>
              <div className="card stat">
                <div className="label tiny">Precipitación</div>
                <div className="value">{Number(current.precipitation || 0).toFixed(1)} mm</div>
              </div>
            </div>

            <div className="card fade-in">
              <div className="label">PRÓXIMOS 7 DÍAS</div>
              <DailyForecast daily={weather.daily} />
            </div>

            <HourlyChart hourly={hourly} />
          </>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const [coords, setCoords] = useState({
    lat: DEFAULT_LOCATION.lat,
    lon: DEFAULT_LOCATION.lon,
  });
  const [weather, setWeather] = useState(null);
  const [place, setPlace] = useState(DEFAULT_LOCATION.label);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeatherAndPlace = useCallback(async (lat, lon) => {
    setLoading(true);
    setError("");

    try {
      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
        `&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;

      const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`;

      const [wRes, gRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(geoUrl, {
          headers: { Accept: "application/json" },
        }).catch(() => null),
      ]);

      if (!wRes.ok) throw new Error("No se pudo obtener el clima.");

      const weatherData = await wRes.json();
      setWeather(weatherData);

      if (gRes && gRes.ok) {
        const geoData = await gRes.json();
        const pretty = formatPlaceName(geoData);
        setPlace(pretty || `Lat ${lat.toFixed(3)}, Lon ${lon.toFixed(3)}`);
      } else {
        setPlace(`Lat ${lat.toFixed(3)}, Lon ${lon.toFixed(3)}`);
      }
    } catch (e) {
      setError("No pudimos actualizar los datos. Revisa la conexión e inténtalo otra vez.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectLocation = useCallback(
    (lat, lon) => {
      setCoords({ lat, lon });
      fetchWeatherAndPlace(lat, lon);
    },
    [fetchWeatherAndPlace]
  );

  useEffect(() => {
    fetchWeatherAndPlace(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
  }, [fetchWeatherAndPlace]);

  return (
    <div className="app-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        :root{
          --bg-1:#050A14;
          --bg-2:#0A1628;
          --accent:#00C2FF;
          --accent-2:#0088CC;
          --text:#E8F4FF;
          --muted:rgba(200,220,255,.62);
          --card:rgba(255,255,255,0.04);
          --border:rgba(0,194,255,0.15);
        }

        *{box-sizing:border-box}
        html, body, #root {margin:0; width:100%; height:100%; background:var(--bg-1); color:var(--text);}
        body{font-family:'DM Sans', sans-serif; overflow:hidden;}
        .app-shell{
          width:100%;
          height:100%;
          display:flex;
          background:
            radial-gradient(circle at 18% 24%, rgba(0,194,255,0.13), transparent 38%),
            radial-gradient(circle at 85% 76%, rgba(0,136,204,0.18), transparent 42%),
            linear-gradient(140deg, var(--bg-1), var(--bg-2));
        }

        .panel-wrap{
          width:40%;
          min-width:340px;
          height:100%;
          position:relative;
          border-right:1px solid rgba(0,194,255,0.09);
          overflow:auto;
          scrollbar-width:thin;
          scrollbar-color: rgba(0,194,255,.5) transparent;
        }
        .panel-inner{padding:22px 20px 26px;}
        .map-wrap{
          width:60%;
          height:100%;
          position:relative;
          background:#02060f;
        }
        #map{width:100%; height:100%;}
        .leaflet-container{background:#02060f;}

        .top-loader{
          position:sticky;
          top:0;
          height:3px;
          width:100%;
          background:linear-gradient(90deg, transparent, rgba(0,194,255,.9), transparent);
          animation: loader 1.1s linear infinite;
          z-index:7;
        }

        .header-row{display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:12px;}
        .place{margin:5px 0 3px; font-size:30px; line-height:1.1; font-weight:500; letter-spacing:.2px;}
        .coords{color:var(--muted); font-size:13px;}
        .hero-icon{filter: drop-shadow(0 10px 20px rgba(0,194,255,.22));}

        .label{
          color:var(--muted);
          font-size:12px;
          letter-spacing:.18em;
          text-transform:uppercase;
          font-weight:400;
        }
        .label.tiny{font-size:11px; letter-spacing:.14em;}

        .card{
          background:var(--card);
          border:1px solid var(--border);
          border-radius:16px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .hero-temp{
          position:relative;
          padding:16px 18px 18px;
          overflow:hidden;
          margin-bottom:14px;
        }
        .hero-glow{
          position:absolute;
          inset:-80px auto auto -70px;
          width:260px;
          height:260px;
          background: radial-gradient(circle, rgba(0,194,255,.23), transparent 62%);
          pointer-events:none;
        }
        .temp-main{
          font-family:'Space Grotesk', sans-serif;
          font-weight:300;
          font-size:72px;
          line-height:0.95;
          margin-top:8px;
          color:#EAF7FF;
        }
        .temp-main span{
          font-size:30px;
          color:#A7DFFF;
          margin-left:2px;
        }
        .weather-text{
          font-family:'Space Grotesk', sans-serif;
          color:#B9E9FF;
          margin-top:4px;
          font-size:17px;
        }

        .stats-grid{
          display:grid;
          grid-template-columns:repeat(2, minmax(0,1fr));
          gap:10px;
          margin-bottom:14px;
        }
        .stat{padding:12px 12px 10px;}
        .value{
          margin-top:6px;
          font-family:'Space Grotesk', sans-serif;
          font-size:16px;
          color:#DDF4FF;
        }

        .daily-row{
          margin-top:10px;
          display:flex;
          gap:10px;
          overflow:auto;
          padding-bottom:6px;
        }
        .daily-card{
          min-width:98px;
          padding:10px;
          border-radius:12px;
          border:1px solid rgba(0,194,255,0.13);
          background:rgba(7,18,36,.65);
          text-align:center;
        }
        .daily-icon-wrap{
          height:40px;
          display:grid;
          place-items:center;
          margin:4px 0;
        }
        .daily-temp{
          font-family:'Space Grotesk', sans-serif;
          font-size:14px;
          color:#CFEFFF;
        }

        .chart-card{
          margin-top:14px;
          padding:12px;
        }
        .chart-svg{
          width:100%;
          height:175px;
          display:block;
          margin-top:8px;
        }

        .error-card{
          margin:12px 0;
          padding:12px 14px;
          border:1px solid rgba(255,120,140,.35);
          background:rgba(255,80,110,.10);
          border-radius:12px;
          color:#FFD5E1;
          font-size:14px;
        }

        .loading-overlay{
          position:absolute;
          inset:0;
          z-index:6;
          display:grid;
          place-items:center;
          background:rgba(4,8,18,0.44);
          backdrop-filter: blur(4px);
        }
        .loading-glass{
          display:flex;
          align-items:center;
          gap:10px;
          padding:12px 16px;
          border-radius:12px;
          border:1px solid var(--border);
          background:rgba(11,22,41,.68);
          color:#CFEFFF;
          font-size:14px;
        }
        .spinner{
          width:18px;
          height:18px;
          border:2px solid rgba(0,194,255,.22);
          border-top-color:#00C2FF;
          border-radius:50%;
          animation: spin .9s linear infinite;
        }

        .weather-svg{overflow:visible}
        .spin-slow{transform-origin:60px 60px; animation: spin 12s linear infinite;}

        .pulse-marker{
          width:16px; height:16px; border-radius:50%;
          background: radial-gradient(circle at 30% 30%, #7BE6FF, #00C2FF 60%, #0088CC);
          box-shadow:0 0 0 0 rgba(0,194,255,.7);
          animation:pulse 1.9s infinite;
          border:1px solid rgba(255,255,255,.6);
        }

        .map-error{
          position:absolute; top:10px; left:10px; right:10px;
          z-index:999;
          color:#FFD8E2;
          background:rgba(255,80,110,.18);
          border:1px solid rgba(255,110,145,.4);
          padding:10px 12px;
          border-radius:10px;
          font-size:13px;
        }

        .fade-in{animation: fade .45s ease;}

        @keyframes pulse{
          0%{box-shadow:0 0 0 0 rgba(0,194,255,.85)}
          70%{box-shadow:0 0 0 18px rgba(0,194,255,0)}
          100%{box-shadow:0 0 0 0 rgba(0,194,255,0)}
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fade{from{opacity:0; transform:translateY(4px)} to{opacity:1; transform:none}}
        @keyframes loader{
          0%{transform:translateX(-55%)}
          100%{transform:translateX(55%)}
        }

        @media (max-width: 900px){
          body{overflow:auto;}
          .app-shell{flex-direction:column; height:auto; min-height:100%;}
          .map-wrap{order:1; width:100%; height:50vh; min-height:320px;}
          .panel-wrap{
            order:2;
            width:100%;
            min-width:0;
            max-height:none;
            border-right:none;
            border-top:1px solid rgba(0,194,255,0.09);
          }
          .place{font-size:24px;}
          .temp-main{font-size:58px;}
        }
      `}</style>

      <WeatherPanel
        weather={weather}
        place={place}
        coords={coords}
        loading={loading}
        error={error}
      />
      <WeatherMap center={coords} onSelectLocation={handleSelectLocation} />
    </div>
  );
}
