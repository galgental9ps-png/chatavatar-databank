/* Tavi movement: gait follows travel distance; release and jumps use gravity. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChatAvatarMotion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WALK_FRAMES = 16;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function dimensions(viewportWidth, viewportHeight = 1000) {
    const size = Math.max(72, Math.min(viewportWidth <= 540 ? 152 : 192, Math.max(72,viewportWidth - 16), Math.max(72,viewportHeight - 24)));
    return { width: size, height: size, ground: 10, stride: size * 0.43, speed: size * 0.44 };
  }
  function gaitPhaseAtDistance(distance, stride) {
    return ((Math.max(0, distance) / Math.max(1, stride)) % 1) * WALK_FRAMES;
  }
  function frameAtDistance(distance, stride) {
    return Math.floor(gaitPhaseAtDistance(distance,stride));
  }
  function walkStep({ x, target, velocity = 0, distance = 0 }, seconds, size) {
    const dt = clamp(seconds, 0, 0.05), remaining = Math.abs(target - x);
    const direction = Math.sign(target - x), acceleration = size.speed * 3.2;
    if (remaining < 0.6) return { x: target, target, velocity: 0, distance, arrived: true };
    const desired = Math.min(size.speed, Math.sqrt(2 * acceleration * remaining));
    const velocityNext = velocity + clamp(desired - velocity, -acceleration * dt, acceleration * dt);
    const travel = Math.min(remaining, Math.max(0, velocityNext) * dt);
    return { x: x + direction * travel, target, velocity: velocityNext, distance: distance + travel, arrived: remaining - travel < 0.6 };
  }
  function fallStep({ y, velocity = 0 }, seconds, ground = 10) {
    const dt = clamp(seconds, 0, 0.05), nextVelocity = velocity + 1100 * dt;
    const nextY = Math.max(ground, y - nextVelocity * dt);
    return { y: nextY, velocity: nextY === ground ? 0 : nextVelocity, landed: nextY === ground, impact: nextY === ground ? nextVelocity : 0 };
  }
  function jumpStep({ y, velocity }, seconds, ground = 10) {
    const dt = clamp(seconds, 0, 0.05), nextVelocity = velocity - 1100 * dt;
    const nextY = Math.max(ground, y + nextVelocity * dt);
    return { y: nextY, velocity: nextVelocity, landed: nextY === ground && nextVelocity < 0 };
  }
  return { WALK_FRAMES, dimensions, clamp, frameAtDistance, gaitPhaseAtDistance, walkStep, fallStep, jumpStep };
});

