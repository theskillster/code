print('''
*******************************************************************************
          |                   |                  |                     |
 _________|________________.=""_;=.______________|_____________________|_______
|                   |  ,-"_,=""     `"=.|                  |
|___________________|__"=._o`"-._        `"=.______________|___________________
          |                `"=._o`"=._      _`"=._                     |
 _________|_____________________:=._o "=._."_.-="'"=.__________________|_______
|                   |    __.--" , ; `"=._o." ,-"""-._ ".   |
|___________________|_._"  ,. .` ` `` ,  `"-._"-._   ". '__|___________________
          |           |o`"=._` , "` `; .". ,  "-._"-._; ;              |
 _________|___________| ;`-.o`"=._; ." ` '`."\` . "-._ /_______________|_______
|                   | |o;    `"-.o`"=._``  '` " ,__.--o;   |
|___________________|_| ;     (#) `-.o `"=.`_.--"_o.-; ;___|___________________
____/______/______/___|o;._    "      `".o|o_.--"    ;o;____/______/______/____
/______/______/______/_"=._o--._        ; | ;        ; ;/______/______/______/_
____/______/______/______/__"=._o--._   ;o|o;     _._;o;____/______/______/____
/______/______/______/______/____"=._o._; | ;_.--"o.--"_/______/______/______/_
____/______/______/______/______/_____"=.o|o_.--""___/______/______/______/____
/______/______/______/______/______/______/______/______/______/______/_____ /
*******************************************************************************
''')
print("Welcome to Treasure Island.")
print("Your mission is to find the treasure.") 

#https://www.draw.io/?lightbox=1&highlight=0000ff&edit=_blank&layers=1&nav=1&title=Treasure%20Island%20Conditional.drawio#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D1oDe4ehjWZipYRsVfeAx2HyB7LCQ8_Fvi%26export%3Ddownload

#Write your code below this line 👇



print("\nYou arrive at the beach. \nWould you like to swim to the Treasure or explore the beach? \n")
if (input("Enter 'swim' or 'explore'.")) == "explore":
  print("\n\nYou look along the beach till you arrive at the shorefront.\n Here you find a boat mored at a small pier.\n")
  print('           mm###########mmm')
  print('        m####################m')
  print('      m#####`"#m m###""""######m')
  print('     ######*"  "   "   "mm#######')
  print('   m####"  ,             m"#######m')
  print('  m#### m*" ,"  ;     ,   "########m')
  print('  ####### m*   m  |#m  ;  m ########')
  print(' |######### mm#  |####  #m##########|')
  print('  ###########|  |######m############')
  print('  "##########|  |##################"')
  print('   "#########  |## /##############"')
  print('     ########|  # |/ m###########')
  print('      "#######      ###########"')
  print('        """"""       """"""""" ')
  print("\nYou can see a dot on the horizon, which must be the Treasure Island.\n Would you like to swim to the Treasure or try and take the boat?\n")
  if (input("Enter 'swim' or 'boat'.")) == "boat":
    print("\n     __/\__")
    print("  ~~~\____/~~~~~~")
    print("    ~  ~~~   ~.  ")
    print("\nYou start to sail on the rickety boat in the restless waves. \nHours later you still are no closer to the Island.\nWhat do you do? Turn back or keep going?\n")
    if (input("Enter 'turn back' or 'keep going'")) =="keep going":
      print("You win")
  else: 
    print("You swim out into the cold sea and get dragged underwater by an unknown creature. \n Game Over.")
else: 
  print("You swim out into the cold sea and get dragged underwater by an unknown creature. \n Game Over.")