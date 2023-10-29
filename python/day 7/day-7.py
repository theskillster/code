# DAY 7 - Hangman

# My suggested flow chart.
# pick/generate a random word
# display/generate blank spaces for char in random_word
# user picks a letter 
# compare letter to random word
# if = true, then update that char in the blank spaces + increase word counter
#     flase, then update the hangman + decrease number of lives remaining

# then if they guessed all the words - word counter complete - they win
# if their lives remaining = 0 they lose


# Lesson 1 Replit

#Step 1 

import random


word_list = ["aardvark", "baboon", "camel"]

#TODO-1 - Randomly choose a word from the word_list and assign it to a variable called chosen_word.
chosen_word = random.choice(word_list)
#TODO-2 - Ask the user to guess a letter and assign their answer to a variable called guess. Make guess lowercase.
guess = input("Guess a letter: ").lower()
#TODO-3 - Check if the letter the user guessed (guess) is one of the letters in the chosen_word.

# if guess in chosen_word:
#     print("Matched")

for char in chosen_word:
    if char == guess:
        print("Matched")
    else: 
        print ("Wrong")


#from replit=day7-start


# correct = 0
# failed = 0

# for letter in chosen_word:
#   if letter == guess:
#     print ("Right")
#     correct += 1
#   else:
#     print ("Wrong")
#     failed += 1

    
# # print(number_of_chars)
# print(f"The random word was {chosen_word}.")
# print(f"you got {correct} correct letters.")
# print(f"you got {failed} incorrect letters.")
# print("Your score is", (correct - failed))


# Lesson 2 replit

#Step 2

import random
word_list = ["aardvark", "baboon", "camel"]
chosen_word = random.choice(word_list)

#Testing code
print(f'Pssst, the solution is {chosen_word}.')

#TODO-1: - Create an empty List called display.
#For each letter in the chosen_word, add a "_" to 'display'.
#So if the chosen_word was "apple", display should be ["_", "_", "_", "_", "_"] with 5 "_" representing each letter to guess.
num_of_letters = len(chosen_word) 
display = []
for i in range(num_of_letters): 
  #display.append('_')
  display += "_" # Instructors solution
print(display)

guess = input("Guess a letter: ").lower()

#TODO-2: - Loop through each position in the chosen_word;
#If the letter at that position matches 'guess' then reveal that letter in the display at that position.
#e.g. If the user guessed "p" and the chosen word was "apple", then display should be ["_", "p", "p", "_", "_"].
a = 0
for letter in chosen_word:
    if letter == guess:
        #cycle through chosen word and match guess to it and take the index and update the blanks.
        display[a] = guess
    a += 1

# Instructors solution
for position in range(num_of_letters):
  letter = chosen_word[position]
  if letter == guess:
    display[position] = letter

#TODO-3: - Print 'display' and you should see the guessed letter in the correct position and every other letter replace with "_".
#Hint - Don't worry about getting the user to guess the next letter. We'll tackle that in step 3.
print(display)