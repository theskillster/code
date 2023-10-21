
print("Hello World!")

# Lesson 1 Day 1 - Printing
print("Day 1 - Python Print Function");
print("The function is declared like this:");
print("print('what to print')")

# Lesson 2 Day 1 - Debugging Practice
## Fix the code below 👇

# print(Day 1 - String Manipulation")
# print("String Concatenation is done with the "+" sign.")
#   print('e.g. print("Hello " + "world")')
# print(("New lines can be created with a backslash and n.")

## Fixed code below
print("Day 1 - String Manipulation")
print('String Concatenation is done with the "+" sign.')
print('e.g. print("Hello " + "world")')
print(("New lines can be created with a backslash and n."))

# Lesson 3 - Day 1 - Input Function

# Provide any name in the input pane below.
# That value can be accessed using the input() function.
# Don't put anything inside the input() function!
# Write your code below this line 👇

name1 = input() 
#input will prompt the console for an input from the keyboard and store this in memory,
# or pass into a calling function/variable
print(len(name1)) #len provides the length of a string - you can pass in functions or variables
#or
print(len(input()))

# Variables

input("What is your name?") #The text in the input function is displayed at the command prompt

name2 = input("What is your name?")
print(name2) #retrieve values stored in variables
#perform multiple actions using variables to simplify complex lines of code; e.g:
print(len(input("What is your name for this long string of code?")))
#This can be made more readable using variables
name3 = input("What is your name?")
length1 = len(name3)
print(length1)

# Lesson 4 - Day 1 - Variables

# use your knowledge of variables to switch the inputs and print to screen
# There are two variables, a and b from input
a = input()
b = input()
# 🚨 Don't change the code above ☝️
####################################
# Write your code below this line 👇
c = a
d = b
a = d
b = c
# or you can use:
# c = a
# a = b
# b = c
# 🚨 Don't change the code below 👇
print("a: " + a)
print("b: " + b)
