# Day 2
# Data Types
# Strings integers floats and booleans
# String

# use the number in brackets to return the char at that place in the string
print("Hello"[0])
print("Hello"[4])

print("123"+"345")  # This will concatenate the strings and not do any calculations

# Integer

print(123+345)
# 342_456_789 underscores act as commas

# Float

# 3141.89

# Boolean

# True
# False

# Check data type
num_char = len(input("What is your name?"))
print(type(num_char))

# Changing data types

new_num_char = str(num_char)  # convert data type to str with str()
print("Your name has " + new_num_char + " characters.")
# float() convert data type to float
# int() converts your data type to int - but you lose the places after the decimal, it doesn't round up/down - just shortens it.

# Lesson 5 - Day 2 - Data Types

print ("Enter a 2 digit Number")
two_digit_number = input()
# 🚨 Don't change the code above 👆
####################################
# Write your code below this line 👇
first_digit = two_digit_number[0]
# first_digit = int(two_digit_number[0]) (class answer)
second_digit = two_digit_number[1]
# second_digit = int(two_digit_number[1])
first_digit = int(first_digit)
second_digit = int(second_digit)
#two_digit_number = first_digit + second_digit
print(first_digit + second_digit)
#print(two_digit_number)

# Mathematical operations in Python

# 3 + 5
# 7 - 4
# 3 * 2
# 6 / 3 # division always gives you a float type and 0.00  decimal place float.
# 2 ** 2 # to the power of x, exponents of

# Calculation is in the order of PEMDAS left to right
print ( 3 * 3 + 3 / 3 - 3) # 3 * 3 = 9 is first, then 3 / 3 = 1.0, then 9 + 1 = 10.0, and finaly 10 - 3 becomes 7.0.
# use the python IDE Thonny if you want to step through the execution process in more detail
print (3 * (3 + 3)/ 3 - 3) # This rearrangement using the brackets will allow this to equal 3.0

# Lessong 6 - Day 2 - BMI Calculator

# 1st input: enter height in meters e.g: 1.65
height = input()
# 2nd input: enter weight in kilograms e.g: 72
weight = input()
# 🚨 Don't change the code above 👆
# Write your code below this line 👇
weight = int(weight)
height = float(height)
bodymassindex = weight / (height ** 2) 
# wasn't an exponent of each other but rather a pwoer of 2 (x * 2) which was the right solution
# or height * height
print(int(bodymassindex)) #solution wants an int conversation and not a rounding
# bodymassindex = int(bodymassindex)
# print(bodymassindex)
# Write your code below this 

print(round(8 / 3, 2)) #rounds the resulting float to 2 decimal places
print(8 // 3) 
#floor division which this drops the decimal places and results in a integar data type

result = 4 / 2
result /= 2 #divides itself by 2
print (result)
score = 0
score += 1 # adds 1 to itself

#mix data types in print function using f-string
score = 0
height = 1.8
isWinning = True

print(f"Your Score is {score} and your height is {height} you are winning is {isWinning}")

# Lesson 7 - Day 2 - Life in Weeks

age = input()
# 🚨 Don't change the code above 👆
# Write your code below this line 👇
age = int(age)
yearsleft = 90 - age
# years = 90 - int(age)
weeksleft = yearsleft * 52
print(f"You have {weeksleft} weeks left.")
#Assuming max age of 90

