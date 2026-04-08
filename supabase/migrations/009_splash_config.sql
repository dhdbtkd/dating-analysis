-- Splash screen shader config
INSERT INTO app_settings (key, value, description) VALUES (
  'splash_config',
  '{
    "colorA": "#01010a",
    "colorB": "#0840b8",
    "colorC": "#10c0d8",
    "colorD": "#5008a8",
    "colorE": "#8830d0",
    "speed": 1.0,
    "warpStrength": 1.0,
    "glowIntensity": 1.0
  }',
  '스플래시 화면 셰이더 설정'
) ON CONFLICT (key) DO NOTHING;
