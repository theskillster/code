#Step 4

import random

stages = ['''
  +---+
  |   |
  O   |
 /|\  |
 / \  |
      |
=========
''', '''
  +---+
  |   |
  O   |
 /|\  |
 /    |
      |
=========
''', '''
  +---+
  |   |
  O   |
 /|\  |
      |
      |
=========
''', '''
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========''', '''
  +---+
  |   |
  O   |
  |   |
      |
      |
=========
''', '''
  +---+
  |   |
  O   |
      |
      |
      |
=========
''', '''
  +---+
  |   |
      |
      |
      |
      |
=========
''']

end_of_game = False
word_list = ["ardvark", "baboon", "camel"]
chosen_word = random.choice(word_list)
word_length = len(chosen_word)
range_length = range(word_length)
match = False
#TODO-1: - Create a variable called 'lives' to keep track of the number of lives left. 
#Set 'lives' to equal 6.

lives = 6

#Testing code
print(f'Pssst, the solution is {chosen_word}.')

#Create blanks
display = []
for _ in range_length:
    display += "_"

while not end_of_game: #or lives != 0:
    guess = input("Guess a letter: ").lower()

    #Check guessed letter
    for position in range_length:
        letter = chosen_word[position]
        # print(f"Current position: {position}\n Current letter: {letter}\n Guessed letter: {guess}")
        if letter == guess:
            display[position] = letter
            match = True

    if not match:
        # print(stages[lives])
        lives -= 1
        
    if lives == 0:
      end_of_game = True
      # print(stages[lives])
      print("You lost.")       

    #TODO-2: - If guess is not a letter in the chosen_word,
    #Then reduce 'lives' by 1. 
    #If lives goes down to 0 then the game should stop and it should print "You lose."
    
    # Instructor solution:
    # if guess not in chosen_word:
    #     lives -= 1
    #     if lives == 0:
    #         end_of_game = True
    #         print("You lose. ")

    #Join all the elements in the list and turn it into a String.
    print(f"{' '.join(display)}")
    match = False

    #Check if user has got all letters.
    if "_" not in display:
        end_of_game = True
        print("You win.")

    #TODO-3: - print the ASCII art from 'stages' that corresponds to the current number of 'lives' the user has remaining.

    # Moved it inline with the lives -= 1 stage
    # Instructor solution was to put the stages printout here. Which didn't appear to work for me.
    print(stages[lives])