# Day 4 - Randomisation and Python Lists

import random #use the random function/module

random_integer = random.randint(1,10) #this will retern a random integer between range of 1 and 10
print(random_integer)

# Modules
# create your own modules as files in the same directory and call it with import xyz
# my_module.pi
## pi = 3.14149246

# import my_module
# print(my_module.pi)

random_float = random.random() #gives a random float between 0 and 0.99x 
random_float = random.random

# you can expand the range out by multiplying the above result
# random_float * 5 would give you anything between 0.000x and 4.999x

love_score = random.randint(1,100)
print(f"Your love score is {love_score}")

# Lesson 13 - Day 4 - Heads or Tails
# You are going to write a virtual coin toss program. It will randomly tell the user "Heads" or "Tails".

# Important, the first letter should be capitalised and spelt exactly like in the example e.g. "Heads", not "heads".

# There are many ways of doing this. But to practice what we learnt in the last lesson, 
# you should generate a random number, either 0 or 1. 
# Then use that number to print out "Heads" or "Tails".

# Write your code below this line 👇
# Hint: Remember to import the random module first. 🎲

import random

outcome = random.randint(0,1)
if outcome == 1:
    result = "Heads"
else:
    result = "Tails"
print(f"{result}")

# Teachers result:
# random_side = random.randint(0, 1)
# if random_side == 1:
#   print("Heads")
# else:
#   print("Tails")

# Python lists - Data Structure
# fruits = [item1, item2]
# fruits = ["apple", "pear", "banana"] # order is determined by the order in the list

states_of_america = ["Delaware", "New Jersey"]
print(states_of_america[0])

