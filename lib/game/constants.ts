// Game Constants
export const GAME_CONFIG = {
  // Canvas
  WIDTH: 400,
  HEIGHT: 600,

  // Santa
  SANTA_WIDTH: 50,
  SANTA_HEIGHT: 50,
  SANTA_X: 80,
  GRAVITY: 0.5,
  JUMP_FORCE: -10,
  MAX_FALL_SPEED: 12,

  // Obstacles
  OBSTACLE_WIDTH: 70,
  GAP_HEIGHT: 220,           // Khoảng trống rộng hơn (dễ hơn)
  OBSTACLE_SPEED: 2,         // Bắt đầu chậm hơn (2 thay vì 2.5)
  OBSTACLE_SPAWN_INTERVAL: 2500,  // Bắt đầu xa hơn (2.5s thay vì 2s)
  MIN_OBSTACLE_HEIGHT: 80,

  // Difficulty - Progressive increase
  SPEED_INCREMENT: 0.15,     // Tăng tốc nhanh hơn để đạt độ khó
  SPEED_INCREMENT_INTERVAL: 5000,  // Tăng tốc mỗi 5s
  MAX_SPEED: 5,              // Tốc độ tối đa vừa phải
  GAP_DECREASE: 4,           // Giảm gap nhanh hơn
  MIN_GAP: 160,              // Gap tối thiểu vẫn chơi được
  SPAWN_INTERVAL_DECREASE: 100,  // Giảm khoảng cách spawn mỗi lần
  MIN_SPAWN_INTERVAL: 1200,  // Khoảng cách tối thiểu giữa obstacles

  // Ground
  GROUND_HEIGHT: 80,

  // Colors
  SKY_COLOR: '#1a365d',
  GROUND_COLOR: '#228B22',
  SNOW_COLOR: '#FFFFFF',
}

export const COLORS = {
  christmas: {
    red: '#C41E3A',
    darkRed: '#8B0000',
    green: '#228B22',
    darkGreen: '#0B3D0B',
    gold: '#FFD700',
    snow: '#FFFAFA',
    pine: '#0B3D0B',
    brick: '#8B4513',
    chimney: '#654321',
  }
}
