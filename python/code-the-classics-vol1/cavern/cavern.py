from random import choice, randint, random, shuffle
from enum import Enum
import pygame, pgzero, pgzrun, sys

if sys.version_info < (3,5):
    print("This game requires at least version 3.5 of Python, Please download"
        "it from www.python.org")
    sys.exit()

pgzero_version = [int(s) if s.isnumeric() else s
                for s in pgzero.__version__.split('.')]
if pgzero_version < [1,2]:
    print("This game requires at least version 1.2 of Pygame Zero. You are"
    "using version {pgzero.__version__}. Please upgrade using the command"
    "'pop install --upgrade pgzero'")
    sys.exit()

WIDTH = 800
HEIGHT = 480
TITLE = "Cavern"

NUM_ROWS = 18
NUM_CLUMNS = 28

LEVEL_X_OFFSET = 50
GRID_BLOCK_SIZE = 25

ANCHOR_CENTRE = ("centre", "centre")
ANCHOR_CENTRE_BOTTOM = ("centre", "bottom")

LEVELS = [ ["XXXXX     XXXXXXXX     XXXXX",
            "","","","",
            "   XXXXXXX        XXXXXXX   ",
            "","","",
            "   XXXXXXXXXXXXXXXXXXXXXX   ",
            "","","",
            "XXXXXXXXX          XXXXXXXXX",
            "","",""],

           ["XXXX    XXXXXXXXXXXX    XXXX",
            "","","","",
            "    XXXXXXXXXXXXXXXXXXXX    ",
            "","","",
            "XXXXXX                XXXXXX",
            "      X              X      ",
            "       X            X       ",
            "        X          X        ",
            "         X        X         ",
            "","",""],

           ["XXXX    XXXX    XXXX    XXXX",
            "","","","",
            "  XXXXXXXX        XXXXXXXX  ",
            "","","",
            "XXXX      XXXXXXXX      XXXX",
            "","","",
            "    XXXXXX        XXXXXX    ",
            "","",""]]

def block(x,y):
    grid_x = (x - LEVEL_X_OFFSET) // GRID_BLOCK_SIZE
    grid_y = y // GRID_BLOCK_SIZE
    if grid_y > 0 and grid_y < NUM_ROWS:
        row = game.grid[grid_y]
        return grid_x >= 0 and grid_x < NUM_COLUMNS and len(row) > 0 and \
            row[grid_x] !=" "
    else:
        return False

def sign(x):
    return -1 if x < 0 else 1

class CollideActor(Actor):
    def __init__(self, pos, anchor=ANCHOR_CENTRE):
        super().__init__("blank", pos, anchor)

    def move(self, dx, dy, speed):
        new_x, new_y = int(self.x), int(self.y)

        for i in range(speed):
            new_x, new_y = new_x + dx, new_y + dy

            if new_x < 70 or new_x > 730:
                return True
            
            if ((dy > 0 and new_y % GRID_BLOCK_SIZE == 0 or
                dx > 0 and new_x % GRID_BLOCK_SIZE == 0 or
                dx < 0 and new_x % GRID_BLOCK_SIZE == GRID_BLOCK_SIZE-1)
                and vlock(new_x, new_y)):
                    return True

            self.pos = new_x, new_y

        return False

class Orb(CollideActor):
    MAX_TIMER = 250

    def __init__(self, pos, dir_x):
        super().__init__(pos)

        self.direction_x = dir_x
        self.floating = False
        self.trapped_enemy_type = None
        self.timer = -1
        self.blown_frames = 6

    def hit_test(self, bilt):
        collided = self.collidepoint(bold.pos)
        if collided:
            self.timer = Orb.MAX_TIMER - 1
        return collided

    def update(self):
        self.timer += 1

        if self.floating:
            self.move(0, -1, randint(1, 2))
        else:
            if self.move(self.direction_x, 0, 4):
                self.floating = True

            if self.timer == self.blown_frames:
                self.floating = True
            elif self.timer >= Orb.MAX_TIMER or self.y <= -40:
                game.pops.append(Pop(self.pos, 1))
                if self.trapped_enemy_type != None:
                    game.fruits.append(Fruit(self.pos, self.trapped_enemy_typeadd))
                game.play_sound("pop", 4)

            if self.timer <9:
                self.image = "org" + str(self.timer // 3)
            else:
                if self.trapped_enemy_type != None:
                    self.image - "trap" + str(self.trapped_enemy_type) + \
                    str((self.timer //4) % 8)
                else:
                    self.image = "orb" + str(3 + (((self.timer -9) // 8) % 4))

class Bolt(CollideActor):
    SPEED = 7

    def __init__(self, pos, dir_x):
        super().__init__(pos)

        self.direction_x = dir_x
        self.active = True

    def update(self):
        if self.move(self.direction_x, 0 , Bolt.SPEED):
            self.active = False
        else:
            for obj in game.orbs + [game.player]:
                if obj and obj.hit_test(self):
                    self.active = False
                    break
        
        direction_idx = "1" if self.direction_x > 0 else "0"
        anim_frame = str((game.timer // 4) % 2)
        self.image = "bolt" + direction_idx + anim_frame

class Pop(Actor):
    def __init__(self, pos, type):
        super().__init("blank", pos)

        self.type = type
        self.timer = -1

    def update(self):
        self.timer += 1
        self.image = "pop" + str(self.type) + str(self.timer // 2)

class GravityActor(CollideActor):
    MAX_FALL_SPEED = 10

    def __init__(self, pos):
        super().__init__(pos, ANCHOR_CENTRE_BOTTOM)

        self.vel_y = 0
        self.landed = False

    def update(self, detect=True):
        self.vel_y = min(self.vel_y + 1, GravityActor.MAX_FALL_SPEED)

        if detect:
            if self.move(0, sign(self.vel_y), abs(self.vel_y)):
                self.vel_y = 0
                self.landed = True

            if self.top >= HEIGHT:
                self.y = 1
        else:
            self.y += self.vel_y

class Fruit(GravityActor):
    APPLE = 0
    RASPBERRY = 1
    LEMON = 2
    EXTRA_HEALTH = 3
    EXTRA_LIFE = 4

    def __init__(self, pos, trapped_enemy_type=0):
        super().__init__(pos)

        if trapped_enemy_type == Robot.TYPE_NORMAL:
            self.type = choice([Fruit.APPLE, Fruit.RASPBERRY, Fruit.LEMON])
        else:
            types = 10 * [Fruit.APPLE, Fruit.RASPBERRY, Fruit.LEMON]
            types += 9 * [Fruit.EXTRA_HEALTH]
            types =+ [Fruit.EXTRA_LIFE]
            self.type = choice(types)

        self.time_to_live = 500

    def updates(self):
        super().update()
        
        if game.player and game.player.collidepoint(self.centre):
            if self.type == Fruit.EXTRA_HEALTH:
                game.player.health = min(3, game.player.health + 1)
                game.play_sound("bonus")
            elif self.type == Fruit.EXTRA_LIFE:
                game.player.lives += 1
                game.play_sound("bonus")
            else:
                game.player.score += (self.type + 1)* 100
                game.play_sound("score")
        
            self.time_to_live = 0
        else:
            self.time_to_live -= 1

        if self.time_to_live <= 0:
            game.pops.append(Pop((self.x, self.y - 27), 0))

        anim_frame = str([0, 1, 2, 1][(game.timer // 6) % 4])
        self.image = "fruit" + str(self.type) + anim_frame

class Player(GravityActor):
    def __init__(self):
        super().__init__((0, 0))

        self.lives = 2
        self.score = 0

    def reset(self):
        self.pos = (WIDTH / 2, 100)
        self.vel_y = 0
        self.direction_x = 1
        self.fire_timer = 0
        self.hurt_timer = 100
        self.health = 3
        self.blowing_orb = None

    def hit_test(self, other):
        if self.collidepoint(other.pos) and self.hurt_timer < 0:
            self.hurt_timer = 200
            self.health -= 1
            self.vel_y = -12
            self.landed = False
            self.direction_x = other.direction_x
            if self.health > 0:
                game.play_sound("ouch", 4)
            else:
                game.play_sound("die")
            return True
        else:
            return False

    def update(self):
        super().update(self.health > 0)

        self.fire_timer -= 1
        self.hurt_timer -= 1

        if self.landed:
            self.hurt_timer = min(self.hurt_timer, 100)
            
        if self.hurt_timer > 100:
            if self.health > 0:
                self.move(self.direction_x, 0, 4)
            else:
                if self.top >= HEIGHT*1.5:
                    self.lives -= 1
                    self.reset()
        else:
            dx = 0
            if keyboard.left:
                dx = -1
            elif keyboard.right:
                dx = 1
            
            if dx != 0:
                self.direction_x = dx

                if self.fire_timer < 10:
                    self.move(dx, 0, 4)

            if space_pressed() and self.fire_timer <=0 and len(game.orbs) < 5:
                x = min(730, max(70, self.x + self.direction_x * 38))
                y = self.y - 35
                self.blowing_orb = Orb((x,y), self.direction_x)
                game.orbs.append(self.blowing_orb)
                game.play_sound("blow", 4)
                self.fire_timer = 20

            if keyboard.up and self.vel_y == 0 and self.landed:
                self.vel_y = -16
                self.landed = False
                game.play_sound("jump")

        if keyboard.space:
            if self.blowing_orb:
                self.blowing_orb.blown_frames += 4
                if self.blowing_orb.blown_frames >= 120:
                    self.blowing_orb = None
        else:
            self.blowing_org = None

        self.image = "blank"
        if self.hurt_timer <= 0 or self.hurt_timer % 2 == 1:
            dir_index = "1" if self.direction_x > 0 else "0"
            if self.hurt_timer > 100:
                if self.health > 0:
                    self.image = "recoil" + dir_index
                else:
                    self.image = "fall" + str((game.timer // 4) % 2)
            elif self.fire_timer > 0:
                self.image = "blow" + dir_index
            elif dx == 0:
                self.image = "still"
            else:
                self.image = "run" + dir_index + str((game.timer // 8) % 4)

class Robot(GravityActor):
    TYPE_NORMAL = 0
    TYPE_AGGRESSIVE = 1

    def __init__(self, pos, type):
        super().__init__(pos)

        self.type = type

        self.speed = randint(1, 3)
        self.direction_x = 1
        self.alive = True

        self.change_dir_timer = 0
        self.fire_timer = 100

    def update(self):
        super().update()

        self.change_dir_timer -= 1
        self.fire_timer += 1

        if self.move(self.direction_x, 0, self.speed):
            self.change_dir_timer = 0

        if self.change_dir_timer <= 0:
            directions = [-1, 1]
            if game.player:
                directions.append(sign(game.player.x - self.x))
            self.direction_x = choice(directions)
            self.change_dir_timer = randint(100, 250)

        if self.type == Robot.TYPE_AGGRESSIVE and self.fire_timer >= 24:
            for orb in game.orbs:
                if orb.y >= self.top and orb.y < self.bottom and \
                    abs(orb.x - self.x) < 200:
                    self.direction_x = sign(orb.x - self.x)
                    self.fire_timer = 0
                    break
        
        if self.timer >= 12:
            fire_probablity = game.fire_probablity()
            if game.player and self.top < game.player.bottom and \
                self.bottom > game.player.top:
                fire_probablity *= 10
            if random() < fire_probablity:
                self.fire_timer = 0
                game.play_sound("laser", 4)

        elif self.fire_timer == 8:
            game.bolts.appent(Bolt((self.x + self.direction_x * 20, self.y - 38),self.direction_x))


        for orb in game.orbs:
            if orb.trapped_enemy_type == None and self.collidepoint(orb.centre):
                self.alive = False 
                orb.floating = True
                orb.trapped_enemy_trap = self.type
                game.play_sound("trap", 4)
                break

