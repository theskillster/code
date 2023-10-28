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