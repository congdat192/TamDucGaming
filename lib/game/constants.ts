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
  OBSTACLE_SPEED: 2.5,       // Chậm hơn lúc đầu
  OBSTACLE_SPAWN_INTERVAL: 2000,
  MIN_OBSTACLE_HEIGHT: 80,

  // Difficulty
  SPEED_INCREMENT: 0.08,     // Tăng tốc chậm hơn
  SPEED_INCREMENT_INTERVAL: 8000,  // Tăng tốc ít thường xuyên hơn
  MAX_SPEED: 6,              // Tốc độ tối đa thấp hơn
  GAP_DECREASE: 3,           // Giảm gap chậm hơn
  MIN_GAP: 150,              // Gap tối thiểu vẫn đủ rộng

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
