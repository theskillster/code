# Day 5 - Python Loops
fruits = ["Apple", "Peach", "Pear"] 
for fruit in fruits:
    print(fruit)
    print(fruit + " Pie") 
# Simple for list that will add a variable to each item in the loop
# Also conduct additional tasks within the for loop

# LESSON 16 - DAY 5 - AVERAGE HEIGHT

# You are going to write a program that calculates the average student height from a List of heights.
# e.g. student_heights = [180, 124, 165, 173, 189, 169, 146]
# The average height can be calculated by adding all the heights together and dividing by the total number of heights.
# e.g.
# 180 + 124 + 165 + 173 + 189 + 169 + 146 = 1146

# There are a total of 7 heights in student_heights
# 1146 ÷ 7 = 163.71428571428572
# Average height rounded to the nearest whole number = 164
# Important You should not use the sum() or len() functions in your answer. You should try to replicate their functionality using what you have learnt about for loops.

# Example Input 1
# 156 178 165 171 187
# In this case, student_heights would be a list that looks like: [156, 178, 165, 171, 187]

# Example Output 1
# total height = 857
# number of students = 5
# average height = 171

# Input a Python list of student heights
student_heights = input().split()
for n in range(0, len(student_heights)):
  student_heights[n] = int(student_heights[n])
# 🚨 Don't change the code above 👆
  
# Write your code below this row 👇
total_height = 0
count = 0
for height in student_heights:
   total_height += height
   count +=1 
average_height = round(total_height / count)
print (f"total height = {total_height}")
print (f"number of students = {count}")
print (f"average height = {average_height}")

# LESSON 17 - DAY 5 - HIGH SCORE

# You are going to write a program that calculates the highest score from a List of scores.

# e.g. student_scores = [78, 65, 89, 86, 55, 91, 64, 89]

# Important you are not allowed to use the max or min functions. The output words must match the example. i.e

# The highest score in the class is: x
# Example Input
# 78 65 89 86 55 91 64 89
# In this case, student_scores would be a list that looks like: [78, 65, 89, 86, 55, 91, 64, 89]

# Example Output
# The highest score in the class is: 91

# Input a list of student scores
student_scores = input().split()
for n in range(0, len(student_scores)):
  student_scores[n] = int(student_scores[n])

# Write your code below this row 👇
highest_score = 0
for score in student_scores:
  if score > highest_score:
    highest_score = score
print(f"The highest score in the class is: {highest_score}")


#For Loop with Range

for number in range(1,11): #(start of range, end of range -1 produces i, i+1, i+2, ..., j-1. start defaults to 0 )
   print(number)

total = 0
for number in range (1,11,3): #third value is the increments/steps
   total += number
print (total)
# Should print all the values to 10 in increments of 3

total = 0
for number in range (1,101):
   total += number
print (total)
# Should print the total sum of all the values from 1-100 = 5050

# LESSON 18 - DAY 5 - ADDING EVEN NUMBERS

# You are going to write a program that calculates the sum of all the even numbers from 1 to X. 
# If X is 100 then the first even number would be 2 and the last one is 100:

# i.e. 2 + 4 + 6 + 8 +10 ... + 98 + 100

# Important, there should only be 1 print statement in your console output. 
# It should just print the final total and not every step of the calculation.

# Also, we will constrain the inputs to only take numbers from 0 to a max of 1000.

# Example Input 1
# 10
# Example Output 1
# 30

target = int(input()) # Enter a number between 0 and 1000
# 🚨 Do not change the code above ☝️

# Write your code here 👇
total = 0
# target +=1 
for number in range (2,target+1,2): #third value is the increments/steps
   total += number
print (total)

# or 
# alternative_sum = 0
# for number in range(1, target + 1):
#   if number % 2 == 0: #if the number is divisible by 2 and therefore even - + to alternative_sum
#     alternative_sum += number
# print(alternative_sum)

# LESSON 19 - DAY 5 - FIZZBUZZ

# Instructions
# You are going to write a program that automatically prints the solution to the FizzBuzz game. These are the rules of the FizzBuzz game:
# Your program should print each number from 1 to 100 in turn and include number 100.
# When the number is divisible by 3 then instead of printing the number it should print "Fizz".
# When the number is divisible by 5, then instead of printing the number it should print "Buzz".`
# And if the number is divisible by both 3 and 5 e.g. 15 then instead of the number it should print "FizzBuzz"
# e.g. it might start off like this:

# 1
# 2
# Fizz
# 4
# Buzz
# Fizz
# 7
# 8
# Fizz
# Buzz
# 11
# Fizz
# 13
# 14
# FizzBuzz

n = 1
max = 100
for n in range(1,max+1):
  if n % 3 == 0 and n % 5 == 0:
    print("FizzBuzz")
  elif n % 5 == 0:
    print("Buzz")
  elif n % 3 == 0:
    print("Fizz")
  else:
     print (n)

