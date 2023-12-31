# Password Generator

#Password Generator Project
import random
letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
symbols = ['!', '#', '$', '%', '&', '(', ')', '*', '+']

print("Welcome to the PyPassword Generator!")
nr_letters= int(input("How many letters would you like in your password?\n")) 
nr_symbols = int(input(f"How many symbols would you like?\n"))
nr_numbers = int(input(f"How many numbers would you like?\n"))


# result.append(random.choice(letters)) you can use this to append to a list (str or int)
result = []
for i in range(nr_letters): # while cycling the range of value (nr_letters):
  result += [random.choice(letters)]   # concatenate to the results list with a random selection from the (letters) list.
  # Essentially doing:
    # random_char = random.choice(letters)
    # password += random_char
  # You could also use password_list.append() to update the list 
for i in range(nr_numbers):
  result += [random.choice(numbers)]
for i in range(nr_symbols):
  result += [random.choice(symbols)]

random.shuffle(result) #This shuffles the items in the list (result)
rando_result = ''.join(result) # ''.join(list) concatenates the list into a single string removing the [] brackets.
print(f"Your password is: {rando_result}")

# Shuffle output answer from course content.
# password = ""
# for char in password_list:
#   password += char

# print(f"Your password is: {password}")

#Eazy Level
# password = ""

# for char in range(1, nr_letters + 1):
#   password += random.choice(letters)

# for char in range(1, nr_symbols + 1):
#   password += random.choice(symbols)

# for char in range(1, nr_numbers + 1):
#   password += random.choice(numbers)

# print(password)