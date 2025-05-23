// Seleciona o elemento <canvas> do HTML e obtém o contexto 2D
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

// Define as dimensões do canvas
canvas.width = 1024
canvas.height = 576

// Preenche o fundo do canvas de preto
c.fillRect(0, 0, canvas.width, canvas.height)

// Define a gravidade que será aplicada aos personagens
const gravity = 0.7

// Cria o fundo do jogo
const background = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: './img/background.png'
})

// Cria a loja no cenário
const shop = new Sprite({
  position: { x: 600, y: 128 },
  imageSrc: './img/shop.png',
  scale: 2.75,        // aumenta a escala da imagem
  framesMax: 1        // remove a animação, imagem estática
})

// Cria o jogador (player) com suas propriedades e sprites
const player = new Fighter({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  offset: { x: 215, y: 157 },   // ajuste de posição para o sprite
  imageSrc: './img/samuraiMack/Idle.png',
  framesMax: 8,
  scale: 2.5,
  sprites: {
    idle: { imageSrc: './img/samuraiMack/Idle.png', framesMax: 8 },
    jump: { imageSrc: './img/samuraiMack/Jump.png', framesMax: 2 },
    fall: { imageSrc: './img/samuraiMack/Fall.png', framesMax: 2 },
    attack1: { imageSrc: './img/samuraiMack/Attack1.png', framesMax: 6 },
    takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', framesMax: 4 },
    death: { imageSrc: './img/samuraiMack/Death.png', framesMax: 6 }
  },
  attackBox: {      // área de colisão de ataque do player
    offset: { x: 100, y: 50 },
    width: 160,
    height: 50
  }
})

// Cria o inimigo (enemy) com suas propriedades e sprites
const enemy = new Fighter({
  position: { x: 960, y: 100 },
  velocity: { x: 0, y: 0 },
  color: 'blue',
  offset: { x: 215, y: 167 },
  imageSrc: './img/kenji/Idle.png',
  framesMax: 4,
  scale: 2.5,
  sprites: {
    idle: { imageSrc: './img/kenji/Idle.png', framesMax: 4 },
    jump: { imageSrc: './img/kenji/Jump.png', framesMax: 2 },
    fall: { imageSrc: './img/kenji/Fall.png', framesMax: 2 },
    attack1: { imageSrc: './img/kenji/Attack1.png', framesMax: 4 },
    takeHit: { imageSrc: './img/kenji/Take hit.png', framesMax: 3 },
    death: { imageSrc: './img/kenji/Death.png', framesMax: 7 }
  },
  attackBox: {      // área de colisão de ataque do inimigo
    offset: { x: -170, y: 50 },
    width: 170,
    height: 50
  }
})

// Objeto que guarda o estado das teclas pressionadas
const keys = {
  a: { pressed: false },
  d: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft: { pressed: false }
}

// Inicia a contagem regressiva do jogo
decreaseTimer()

// Função principal de animação e atualização do jogo
function animate() {
  window.requestAnimationFrame(animate)   // loop de animação

  // Preenche o fundo do canvas de preto
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)

  // Atualiza o background e a loja
  background.update()
  shop.update()

  // Adiciona uma camada branca translúcida para efeito visual
  c.fillStyle = 'rgba(255, 255, 255, 0.15)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  // Atualiza os personagens
  player.update()
  enemy.update()

  // Reseta a velocidade horizontal dos personagens
  player.velocity.x = 0
  enemy.velocity.x = 0

  // Movimentação do player
  if (keys.a.pressed && player.lastKey === 'a') {
    player.velocity.x = -5
  } else if (keys.d.pressed && player.lastKey === 'd') {
    player.velocity.x = 5
  }

  // Troca de sprites do player dependendo do movimento
  if (player.velocity.y < 0) player.switchSprite('jump')
  else if (player.velocity.y > 0) player.switchSprite('fall')
  else player.switchSprite('idle')

  // Movimentação do enemy
  if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
    enemy.velocity.x = -5
  } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
    enemy.velocity.x = 5
  }

  // Troca de sprites do enemy dependendo do movimento
  if (enemy.velocity.y < 0) enemy.switchSprite('jump')
  else if (enemy.velocity.y > 0) enemy.switchSprite('fall')
  else enemy.switchSprite('idle')

  // Verifica colisão de ataque do player com o enemy
  if (
    rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
    player.isAttacking &&
    player.framesCurrent === 4  // apenas no frame certo o ataque acerta
  ) {
    enemy.takeHit()
    player.isAttacking = false
    gsap.to('#enemyHealth', { width: enemy.health + '%' })  // animação de barra de vida
  }

  // Cancela o ataque do player se o frame de ataque já passou
  if (player.isAttacking && player.framesCurrent === 4) {
    player.isAttacking = false
  }

  // Verifica colisão de ataque do enemy com o player
  if (
    rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
    enemy.isAttacking &&
    enemy.framesCurrent === 2
  ) {
    player.takeHit()
    enemy.isAttacking = false
    gsap.to('#playerHealth', { width: player.health + '%' })  // animação de barra de vida
  }

  // Cancela o ataque do enemy se o frame de ataque já passou
  if (enemy.isAttacking && enemy.framesCurrent === 2) {
    enemy.isAttacking = false
  }

  // Verifica se algum personagem perdeu toda a vida
  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId })
  }
}

animate()  // inicia a animação do jogo

// Event listener para detectar quando uma tecla é pressionada
window.addEventListener('keydown', (event) => {
  if (!player.dead) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true
        player.lastKey = 'd'
        break
      case 'a':
        keys.a.pressed = true
        player.lastKey = 'a'
        break
      case 'w':
        player.velocity.y = -20  // pulo
        break
      case 's':
        player.attack()         // ataque
        break
    }
  }

  if (!enemy.dead) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        enemy.lastKey = 'ArrowRight'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        enemy.lastKey = 'ArrowLeft'
        break
      case 'ArrowUp':
        enemy.velocity.y = -20  // pulo
        break
      case 'ArrowDown':
        enemy.attack()          // ataque
        break
    }
  }
})

// Event listener para detectar quando uma tecla é solta
window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break
    case 'ArrowRight':
      keys.ArrowRight.pressed = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false
      break
  }
})
