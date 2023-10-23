## Tip Calculator Project

#If the bill was $150.00, split between 5 people, with 12% tip.
#Each person should pay (150.00 / 5) * 1.12
#Round the result to 2 decimal places = 33.60

print("Welcome to the tip calculator.")
total_bill = float(input("What was the total bill? $"))
tip_percentage = int(input("What percentage up would you like to give? 10, 12, or 15? "))
num_people = int(input("How many people to split the bill? "))
tip_percentage = tip_percentage / 100
tip_amount = total_bill * tip_percentage
total_to_pay = total_bill + tip_amount
# total_to_pay = tip_percentage / 100 * bill + bill #shorter version inc the above 3 lines into one calculation
total_per_person = total_to_pay / num_people
# to handle the formatting issue of losing a zero on the end of the pence
# total_per_person = round(total_per_person , 2)
total_per_person = "{:.2f}".format(total_per_person)
print (f"Each person should pay: ${total_per_person}")
