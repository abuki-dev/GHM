// 1 Training :id,category ,description,
// 2 membership_Plans :id,fk_training_id,title, descriptuon ,duration_days,tier(vip,vvip,normal),price
// 3 member :id,name,email,sex,age,weight
// 4 trainer:id,name,email,profession,experience,salary ,hire date
// 5 checkins:id,fk_userID,date
// 6 subscription_purchases:id,fk_member_id,fk_membership_Plans_id,Payment_id,start,end,status(active,expired)
// 7 sessions:id,fk_trainer_id,fk_member_id,start_time,end_time,calories_Burned,status,client_notes(fellens),date_duartion
// 8 payments:id,member_id,amount_payed,plan_id,status(verfied,failed),date_issued,verfiyed_by
// 9 Shifts:id,PlanID,Start_Time ,End_Time,trainerId ,max spots,Days_of The week,Name,Period
// 10 staff:name,email,salary,phone
// 11 admin :name,email,
// 12 feedbacks,id,title,body,user_id
