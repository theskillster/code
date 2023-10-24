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
    if age < 12:
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

# Lesson 10 - Day 3 - Leap Year

# on every year that is divisible by 4 with no remainder
# except every year that is evenly divisible by 100 with no remainder
# unless the year is also divisible by 400 with no remainder

# Which year do you want to check?
year = int(input())
# 🚨 Don't change the code above 👆

# Write your code below this line 👇
# if year % 4 == 0:
#     print("leap year")
# elif year % 100 != 0:
#     print("leap year")
# elif year % 400 == 0:
#     print("leap year")
# else:
#     print("Not a leap year")

# # a = year % 4
# # b = year % 100
# # c = year % 400

# # print(a)
# # print(b)
# # print(c)

if year % 4 == 0 :
  if year % 100 == 0:
    if year % 400 == 0:
      print("Leap year")
    else: 
      print("Not leap year")
  else:
    print("Leap year")
else:
  print("Not leap year")

# multiple if statements and identation

print("Welcome to the rollercoaster!")
height = int(input("What is your height in cm? "))

if height >= 120: #if height is great than or equal to:
    print("You can ride the rollercoaster!")
    age = int(input("What is your age? "))
    if age < 12:
        print("Child tickets are $5.")
        bill = 5
    elif age <=18: #Else if, elif (not the lack of colon) is to add more ifs in a single else statment.
        print("Youth tickets are $7.") 
        bill = 7
    else:
        print("Adult tickets are $12.")
        bill = 12
# seperate if statement, outside the above statement but inside the root if statement.
    wants_photo = input("Do you want a photo taken? Y or N. ")
    if wants_photo == "Y":
        bill += 3
    
    print(f"Your final bill is {bill}")
else:
    print("Sorry, you have to grow taller before you can ride.")


# Lesson 11 - Day 3 - Pizza order practice

# Small pizza (S): $15
# Medium pizza (M): $20
# Large pizza (L): $25
# Add pepperoni for small pizza (Y or N): +$2
# Add pepperoni for medium or large pizza (Y or N): +$3
# Add extra cheese for any size pizza (Y or N): +$1

print("Thank you for choosing Python Pizza Deliveries!")
size = input() # What size pizza do you want? S, M, or L
add_pepperoni = input() # Do you want pepperoni? Y or N
extra_cheese = input() # Do you want extra cheese? Y or N
# 🚨 Don't change the code above 👆
# Write your code below this line 👇
bill = 0
if size == "S":
    bill += 15
    if add_pepperoni == "Y":
        bill += 2
elif size == "M":
    bill += 20
    if add_pepperoni == "Y": #this could be done as a standalone if statement.
        bill += 3   
else:
    bill += 25
    if add_pepperoni == "Y":
        bill += 3

if extra_cheese == "Y":
    bill += 1

print(f"Your final bill is: ${bill}.")


# Logical operators
# A and B
# C or D 
# not E

# Lesson 12 - Day 3 - Love Calculator

print("The Love Calculator is calculating your score...")
name1 = input() # What is your name?
name2 = input() # What is their name?
# 🚨 Don't change the code above 👆
# Write your code below this line 👇
combined_name = name1 + name2
lowered_name = combined_name.lower()

score1 = 0
score2 = 0
# count for instances of "t" and increment the score counter
score1 += (lowered_name.count("t"))  
score1 += (lowered_name.count("r"))
score1 += (lowered_name.count("u"))
score1 += (lowered_name.count("e"))

score2 += (lowered_name.count("l"))
score2 += (lowered_name.count("o"))
score2 += (lowered_name.count("v"))
score2 += (lowered_name.count("e"))

# final_score = (score1 * 10)+score2 #originally I moved score1 by an exponent of 1, 
# but the correct solution was to just turn the scores into string and concatenate them.
final_score = int(str(score1) + str(score2))

if (final_score < 10) or (final_score > 90):
    print(
        f"Your score is {final_score}, you go together like coke and mentos.")
elif (final_score >= 40) and (final_score <= 50):
    print(f"Your score is {final_score}, you are alright together.")
else:
    print(f"Your score is {final_score}.")



    


