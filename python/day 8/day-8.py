# DAY 8
# Functions with Inputs
# Arguments and Parameters

# Functions
# define a function

def my_function(): #(This is the Parameter):
    #Do This
    #Then do This
    #Finally do this
    print("Test")

# call a function
my_function() #(This is the Argument)

# Lesson 1 - functions with Inputs
# Review: 
# Create a function called greet(). 
# Write 3 print statements inside the function.
# Call the greet() function and run your code.

def greet():
    print("I like Final Fantasy")
    print("I Love Final Fantasy VII")
    print("I'm really excited for FF7 Rebirth!")

greet()

# Functions with Inputs

def greet_with_name(name):
    print(f"I like {name}")
    print(f"I Love {name} VII")
    print(f"I'm really excited for {name} Rebirth!")

greet_with_name("Spiderman")

# Lesson 2 - Positional vs. Keyword Arguments

# Functions with more than 1 input
def greet_with(name, location):
    print(f"Hello {name}")
    print(f"What is it like in {location}?")

greet_with("Jack Bauer", "Nowhere") #Positional argument

# You can use Keyword argments to fix the positions.
def my_function2(a,b,c):
    print()

my_function2(a=1, b=2, c=3)

greet_with(name="Jack", location="NoWhere")

# Lesson 3 - LESSON 20 - DAY 8 - PAINT AREA CALCULATOR
# Instructions
# You are painting a wall. 
# The instructions on the paint can says that 1 can of paint can cover 5 square meters of wall. 
# Given a random height and width of wall, calculate how many cans of paint you'll need to buy.

# number of cans = (wall height x wall width) ÷ coverage per can.

# e.g. Height = 2, Width = 4, Coverage = 5

# number of cans = (2 \* 4) / 5
#                = 1.6
# But because you can't buy 0.6 of a can of paint, the result should be rounded up to 2 cans.

# IMPORTANT: Notice the name of the function and parameters must match those on line 13 for the code to work.

# Example Input
# 3
# 9
# Example Output
# You'll need 6 cans of paint.



# Write your code below this line 👇
from math import ceil #Ceil is used to round up to the nearest number

def paint_calc(height, width, cover):
    total = ceil(((height * width)/cover))
    print(f"You'll need {total} cans of paint.")

# Write your code above this line 👆
# Define a function called paint_calc() so the code below works.   

# 🚨 Don't change the code below 👇
test_h = int(input()) # Height of wall (m)
test_w = int(input()) # Width of wall (m)
coverage = 5
paint_calc(height=test_h, width=test_w, cover=coverage)

# Lesson 4 - LESSON 21 - DAY 8 - PRIME NUMBERS

# Prime numbers are numbers that can only be cleanly divided by themselves and 1.
# https://en.wikipedia.org/wiki/Prime_number
# You need to write a function that checks whether if the number passed into it is a prime number or not.

# e.g. 2 is a prime number because it's only divisible by 1 and 2.
# But 4 is not a prime number because you can divide it by 1, 2 or 4.

# Example Input 1
# 73
# Example Output 1
# It's a prime number.
# Example Input 2
# 75
# Example Output 2
# It's not a prime number.


# Write your code below this line 👇
def prime_checker(number):
    prime_number = False
    while not prime_number:
        for a in range(number): # and a > 1:
            if n % a == 0 and a > 1:
                prime_number = True
                print((n % a))
                print(a)
            
    print(prime_number)

# Write your code above this line 👆
    
#Do NOT change any of the code below👇
n = int(input()) # Check this number
prime_checker(number=n)










































