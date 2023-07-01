class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vector) {
    return new Vector2D(this.x + vector.x, this.y + vector.y);
  }

  distance(vector) {
    return Math.sqrt(Math.pow(vector.y - this.y, 2) + Math.pow(vector.x - this.x, 2));
  }
}
