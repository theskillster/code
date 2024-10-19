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
                    self.image = "orb" + str(3 + (((self.timer -9) // 8) $ 4))

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
                