## Day 3 
# Conditional Statements, Logical Operators, Code Blocks and Scope

# if condition:
#     do this
# else:
#     do this 

print("Welcome to the rollercoaster!")
height = int(input("What is your height in cm?"))

if height >= 120: #if height is great than or equal to:
    print("You can risde the rollercoaster!")
else:
    print("Sorry, you have to grow taller before you can ride.")

# Operators:
# > Greater than
# < Less than
#  >= Greater than or equal to
#  <= Less than or equal to
#  == Equal to
#  != Not equal to

# Lesson 8 - Day 3 - Odd or Even

#The modulo is written as a percentage sign (%) in Python. It gives you the remainder after a division.


# Which number do you want to check?
number = int(input())
# 🚨 Don't change the code above 👆

# Write your code below this line 👇
remainder = number % 2
if remainder != 0:
# if number % 2 == 0:
# if the number can be divided by 2 with 0 remainder.
    print ("This is an odd number.")
else:
# Otherwise (number cannot be divided by 2 with 0 remainder).
    print ("This is an even number.")

# Nested if statement

print("Welcome to the rollercoaster!")
height = int(input("What is your height in cm? "))

if height >= 120: #if height is great than or equal to:
    print("You can ride the rollercoaster!")
    age = int(input("What is your age? "))
    if age <= 12:
        print("Please pay $5.")
    elif age <=18: #Else if, elif (not the lack of colon) is to add more ifs in a single else statment.
        print("Please pay $7.") 
    else:
        print("Please pay $12.")
else:
    print("Sorry, you have to grow taller before you can ride.")


# Lesson 9 - Day 3 - BMI 2.0

# Under 18.5 they are underweight
# Over 18.5 but below 25 they have a normal weight
# Equal to or over 25 but below 30 they are slightly overweight
# Equal to or over 30 but below 35 they are obese
# Equal to or over 35 they are clinically obese.
"Your BMI is 18.28678, you are underweight."
"Your BMI is {bodymassindex}, you have a normal weight."
"Your BMI is {bodymassindex} you are slightly overweight."
"Your BMI is {bodymassindex}, you are obese."
"Your BMI is {bodymassindex}, you are clinically obese."

# Enter your height in meters e.g., 1.55
height = float(input())
# Enter your weight in kilograms e.g., 72
weight = int(input())
# 🚨 Don't change the code above 👆

#Write your code below this line 👇

bodymassindex = weight / (height ** 2) 
if bodymassindex < 18.5:
    print(f"Your BMI is {bodymassindex}, you are underweight")
elif bodymassindex < 25:
    print(f"Your BMI is {bodymassindex}, you have a normal weight.")
elif bodymassindex < 30:
    print(f"Your BMI is {bodymassindex}, you are slightly overweight.")
elif bodymassindex < 35:
    print(f"Your BMI is {bodymassindex}, you are obese.")
else:
    print(f"Your BMI is {bodymassindex}, you are clinically obese.")