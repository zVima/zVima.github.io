/**
 * A bird-like object, simulating flock behaviour
 */
class Boid {
  constructor(position, velocity, acceleration, color) {
    this.position = position;
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.color = color;
  }

  // Udpating the boids Position
  update(width, height, turnFactor, offset) {
    if (this.position.x < offset) {
      this.velocity.x += turnFactor;
    } else if (this.position.x > width - offset) {
      this.velocity.x -= turnFactor;
    }
    if (this.position.y > height - offset) {
      this.velocity.y -= turnFactor;
    } else if (this.position.y < offset) {
      this.velocity.y += turnFactor;
    }

    this.velocity.add(this.acceleration);
    this.position = this.position.add(this.velocity);
    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }
}
