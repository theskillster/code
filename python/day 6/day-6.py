# DAY 6 - Functions, Code Blocks and While Loops

# creating your own functions
import random


def my_function():
    print("Hello")
    print("Bye")

# calling your function
my_function()

# including it in a seperate file - you'll need to save it as a *.py

# import my_function as my_function

# Reborg's World
# https://reeborg.ca/reeborg.html?lang=en&mode=python&menu=worlds%2Fmenus%2Freeborg_intro_en.json&name=Alone&url=worlds%2Ftutorial_en%2Falone.json

# Create a function in reborg to turn around 
def turn_around():
    turn_left()
    turn_left()

# Create a function to turn right
def turn_right():
    turn_left()
    turn_left()
    turn_left()

# Create a square with the robot
turn_left()
move()
turn_right()
move()
turn_right()
move()
turn_right()
move()

# Hurdle challenge 1

def turn_right():
    turn_left()
    turn_left()
    turn_left()
    
def hurdle():
    move()
    turn_left()
    move()
    turn_right()
    move()
    turn_right()
    move()
    turn_left()

# i = 0
# while i < 6:
#     hurdle()
#     i += 1

for step in range(6):
    hurdle()


# Indentation
def my_function():
    if sky == "clear":
        print("blue")
    elif sky == "cloudy":
        print("grey")
    print("Hello")
print("World")


# While Loop
# While something is true:
# Do this
# can run indefinitly

# Hurdles Challenge 2
# This time the finish flag is randomly placed.
def turn_right():
    turn_left()
    turn_left()
    turn_left()
    
def hurdle():
    move()
    turn_left()
    move()
    turn_right()
    move()
    turn_right()
    move()
    turn_left()
    
# for step in range(6):
# while at_goal() == False: 
while not at_goal(): #no need to check boolean.
    #Detects if we are at the finish flag
    hurdle()

# Hurdle Challenge 3
# Wall/Hurdles are randomly placed

# Have to nest a if else into the while loop 
# and use the front_is_clear function to detect a wall in front
def turn_right():
    turn_left()
    turn_left()
    turn_left()
    
def hurdle():
#    move()
    turn_left()
    move()
    turn_right()
    move()
    turn_right()
    move()
    turn_left()
    
# for step in range(6):
while not at_goal():
    if front_is_clear() == True:
        # print(object_here())
        # print(front_is_clear())
        move()
    else:
        # print(front_is_clear())
        # print(object_here())
        hurdle()

# Instructor solution
# while not at_goal():
#     if wall_in_front():
#         jump()
#     else:
#         move()

# Hurdles Challenge 4
# The position, the height and the number of hurdles changes each time this world is reloaded.
# My solution was to check for the wall on the right of the robot
#when jumping, and on falling check for a wall in front to stop moving.

def turn_right():
    turn_left()
    turn_left()
    turn_left()
    
def hurdle():
    turn_left()
    while wall_on_right():
        move()
    turn_right()
    move()
    turn_right()
    while not wall_in_front():
        move()
    turn_left()
    
while not at_goal():
    if wall_in_front():
        hurdle()
    else:
        move()

# Final Challenge Robot Maze

# Lost in a maze
# Reeborg was exploring a dark maze and the battery in its flashlight ran out.

# Write a program using an if/elif/else statement so Reeborg can find the exit. The secret is to have Reeborg follow along the right edge of the maze, 
# turning right if it can, going straight ahead if it can’t turn right, or turning left as a last resort.

# What you need to know
# The functions move() and turn_left().
# Either the test front_is_clear() or wall_in_front(), right_is_clear() or wall_on_right(), and at_goal().
# How to use a while loop and if/elif/else statements.
# It might be useful to know how to use the negation of a test (not in Python).

while not at_goal():
    if not front_is_clear():
        turn_right()
    elif front_is_clear():
        move()
    else: turn_left()

# Instructor solution

while not at_goal():
    if right_is_clear():
        turn_right()
        move()
    elif front_is_clear():
        move()
    else: 
        turn_left()
# HOWEVER you can get into a loop if there is a clear square around the robot


# My other attempts
def turn_right():
    turn_left()
    turn_left()
    turn_left()
    
while not at_goal():
    while front_is_clear():
        if wall_on_right():
            move()
        elif right_is_clear():
            turn_right()
        else: turn_left()
    if wall_in_front() and wall_on_right():
        turn_left()
    else: turn_right()


def turn_right():
    turn_left()
    turn_left()
    turn_left()
    
while not at_goal():
    print(f"front is clear, {front_is_clear()}")
    while front_is_clear():
        if wall_on_right():
            print(f"wall on right, {wall_on_right()}")
#        elif right_is_clear():
#            turn_right()
        else: turn_left()
        move()
    if wall_in_front() and wall_on_right():
        turn_left()
    else: 
        turn_right()
        print(f"wall on right, {wall_on_right()}")
        print(f"clear on right, {right_is_clear()}")
####
def turn_right():
    turn_left()
    turn_left()
    turn_left()
    
while not at_goal():
    print(f"at goal, {at_goal()}")
    print(f"object, {object_here()}")
    print(f"front is clear, {front_is_clear()}")
    while front_is_clear(): # and wall_on_right():
        move()
        if not wall_on_right(): #not
            print(f"wall on right, {wall_on_right()}")
            turn_right()
#        else: 
#            turn_left()
#            print("turned left")

    if wall_in_front():# and wall_on_right():
        turn_left()
        print("turned left")
    else: 
        turn_right()
        print(f"wall on right, {wall_on_right()}")
        print(f"wall in front, {wall_in_front()}")