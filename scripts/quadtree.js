/**
 * Represents the boundaries of an rectangle
 */
class Rectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  // Checking if a boid is withing the boundries of this Rectangle
  contains(boid) {
    return (boid.position.x >= this.x &&
      boid.position.x <= this.x + this.w &&
      boid.position.y >= this.y &&
      boid.position.y <= this.y + this.h);
  }

  intersects(range) {
    return !(range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h);
  }
}

/**
 * Splitting a given boandary up into multiple rectangles, based on its capacity
 */
class QuadTree {
  constructor(boundary, capacity) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.boids = [];
    this.divided = false;
  }

  // Dividing the rectangle into 4 sub rectangles 
  divide() {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w;
    const h = this.boundary.h;

    const nwRect = new Rectangle(x, y, w / 2, h / 2);
    const neRect = new Rectangle(x + w / 2, y, w / 2, h / 2);
    const swRect = new Rectangle(x, y + h / 2, w / 2, h / 2);
    const seRect = new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2);

    this.northWest = new QuadTree(nwRect, this.capacity);
    this.northEast = new QuadTree(neRect, this.capacity);
    this.southWest = new QuadTree(swRect, this.capacity);
    this.southEast = new QuadTree(seRect, this.capacity);
    this.divided = true;
  }

  // inserting a boid into its fitting rectangle
  insert(boid) {
    if (!this.boundary.contains(boid)) {
      return false;
    }

    if (this.boids.length < this.capacity) {
      this.boids.push(boid);
      return true;
    } else {
      if (!this.divided) {
        this.divide();
      }

      if (this.northWest.insert(boid)) {
        return true;
      } else if (this.northEast.insert(boid)) {
        return true;
      } else if (this.southWest.insert(boid)) {
        return true;
      } else if (this.southEast.insert(boid)) {
        return true;
      }
    }
  }

  query(range, boidsInRange) {
    if (!boidsInRange) {
      boidsInRange = [];
    }

    if (!this.boundary.intersects(range)) {
      return boidsInRange;
    }

    for (let boid of this.boids) {
      if (range.contains(boid)) {
        boidsInRange.push(boid);
      }
    }

    if (this.divided) {
      this.northWest.query(range, boidsInRange);
      this.northEast.query(range, boidsInRange);
      this.southWest.query(range, boidsInRange);
      this.southEast.query(range, boidsInRange);
    }

    return boidsInRange;
  }

  // Drawing the current Quad Tree onto and Canvas 
  show(context) {
    context.beginPath();
    context.lineWidth = 1;
    context.strokeStyle = "rgba(255, 255, 255, 0.075)";
    context.rect(this.boundary.x, this.boundary.y, this.boundary.w, this.boundary.h);
    context.stroke();

    if (this.divided) {
      this.northWest.show(context);
      this.northEast.show(context);
      this.southWest.show(context);
      this.southEast.show(context);
    }
  }
}
