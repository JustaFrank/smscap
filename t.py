import csv
lines = []
with open('data.txt','r') as file:
    with open('data.csv', 'w') as csvfile:
            spamwriter = csv.writer(csvfile)
            for line in file:
                a = line.replace('\n','').replace('"',"").strip().split('\t')
                a.reverse()
                spamwriter.writerow(a)
    

    