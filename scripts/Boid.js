/**
 * A bird-like object, simulating flock behaviour
 */
class Boid {
  constructor(position, velocity, size) {
    this.position = position;
    this.velocity = velocity;
    this.size = size;
  }

  // Udpating the boids Position
  update(width, height, turnFactor, offset) {
    if (this.position.x < offset) {
      this.velocity.x = this.velocity.x + turnFactor;
    } 
    if (this.position.x > width - offset) {
      this.velocity.x = this.velocity.x - turnFactor;
    }
    if (this.position.y > height - offset) {
      this.velocity.y = this.velocity.y - turnFactor;
    } 
    if (this.position.y < offset ) {
      this.velocity.y = this.velocity.y + turnFactor;
    }
    
    this.position = this.position.add(this.velocity);
  }

  // Drawing the Boid onto the display as an Square
  draw(context) {
    const x = this.position.x - (this.size / 2);
    const y = this.position.y - (this.size / 2);

    context.beginPath();
    context.fillStyle = "rgba(255, 255, 255, .15)";
    context.rect(x, y, this.size, this.size);
    context.fill();
  }
}
