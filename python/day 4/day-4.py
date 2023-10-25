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

# create a list
states_of_america = ["Delaware", "New Jersey"]
# search/print from the list
print(states_of_america[0]) # [-1] allows to retreive the last item in the list, -2 would be second last etc
# append the list
states_of_america.append("SomeNewState") # append allows to add to the end of the list.
print(states_of_america)

# LESSON 14 - DAY 4 - BANKER ROULETTE

# You are going to write a program that will select a random name from a list of names. 
# The person selected will have to pay for everybody's food bill.
# Important: You are not allowed to use the choice() function.
# Line 1 splits the string names_string into individual names and puts them inside a List called names. 
# For this to work, you must enter all the names as names followed by comma then space. e.g. name, name, name
# NOTE: Don't worry about getting hold of the input(), we've done the work behind the scenes to import everything.
# HINT: Assume that names looks like this: input: x, y, z, names = ["x", "y", "z"]
# Example Input
# Angela, Ben, Jenny, Michael, Chloe
# Note: notice that there is a space between the comma and the next name.

# Example Output
# Michael is going to buy the meal today!

names_string = input("Give me everybody's names, separated by a comma. ") 
#behind the scenes code pulled from old replit repo
names = names_string.split(", ")
# The code above converts the input into an array seperating
#each name in the input by a comma and space.
# 🚨 Don't change the code above 👆
import random
payer = random.randint (0, (len(names) - 1)) #get a random integer (between 0 and (length of (names) list -1)) 
# remember length starts from 1 to x while lists start from 0, hence the -1
print(f"{names[payer]} is going to buy the meal today!")
# choose the random value from the list and print it)

# Instructions answers
# import random

# # Get the total number of items in list.
# num_items = len(names)
# # Generate random numbers between 0 and the last index. 
# random_choice = random.randint(0, num_items - 1)
# # Choose and print a random name.
# print(names[random_choice])

# Index out of range error. When you are calling an entry in the list index that doesn't exist.

# Nested lists.

List1 = ["a","b","c"]
List2 = ["x","y","z"]

List_all = [List1, List2]

print(List_all)

# LESSON 15 - DAY 4 - TREASURE MAP

# You are going to write a program that will mark a spot on a map with an X.
# In the starting code, you will find a variable called map.
# This map contains a nested list. When map is printed this is what it looks like, notice the nesting:
# [['⬜️', '⬜️', '⬜️'],['⬜️', '⬜️', '⬜️'],['⬜️', '⬜️', '⬜️']]
# This is a bit hard to work with. 
# So on lines 6 and 23, we've used this line of code print(f"{row1}\n{row2}\n{row3}") to format the 3 lists to be printed as a 3 by 3 grid, each on a new line.
# ['⬜️', '⬜️', '⬜️']
# ['⬜️', '⬜️', '⬜️']
# ['⬜️', '⬜️', '⬜️']
# Now it looks a bit more like the coordinates of a real map:

# Example Input 1
# B3
# Example Output 1
# Hiding your treasure! X marks the spot.
# ['⬜️', '️⬜️', '️⬜️']
# ['⬜️', '⬜️', '️⬜️']
# ['⬜️️', 'X', '⬜️️']

line1 = ["⬜️","️⬜️","️⬜️"]
line2 = ["⬜️","⬜️","️⬜️"]
line3 = ["⬜️️","⬜️️","⬜️️"]
map = [line1, line2, line3]
print("Hiding your treasure! X marks the spot.")
position = input() # Where do you want to put the treasure?
# 🚨 Don't change the code above 👆
# Write your code below this row 👇
y = int(position[1]) - 1
x = position[0]
if x == "A":
    map[y][0] = "X"
elif x == "B":
    map[y][1] = "X"
elif x == "C":
    map[y][2] = "X"
else:
    print("Enter the correct format ie A1")
# Write your code above this row 👆
# 🚨 Don't change the code below 👇
print(f"{line1}\n{line2}\n{line3}")

# Teacher solution

# letter = position[0].lower()
# abc = ["a", "b", "c"]
# letter_index = abc.index(letter) 
# ## Note the list.index() can be used to match the input from a list and return the position.
# number_index = int(position[1]) - 1
# map[number_index][letter_index] = "X"


# Reference inside nested lists

# L = ['a', 'b', ['cc', 'dd', ['eee', 'fff']], 'g', 'h']

# print(L[2])
# # Prints ['cc', 'dd', ['eee', 'fff']]

# print(L[2][2])
# # Prints ['eee', 'fff']

# print(L[2][2][0])
# # Prints eee