import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { Comment } from '../shared/comment';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { catchError, switchMap } from 'rxjs/operators'

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { trigger, state, style, animate, transition } from '@angular/animations';
import { visibility, flyInOut, expand } from '../animations/app.animations';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
  },
  animations: [
    visibility(),
    flyInOut(),
    expand()
  ]
})
export class DishdetailComponent implements OnInit {
  @Input()
  dish: Dish;

  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  dishcopy: Dish;
  visibility = 'shown';

  @ViewChild('cform') commentFormDirective;
  commentForm: FormGroup;
  newComment: Comment = {
    'author': '',
    'rating': 5,
    'comment': '',
    'date': ""
  };
  validComment: boolean = true;

  
  constructor(private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL) { 
      this.createForm();
    }

  ngOnInit() {
    //const id = this.route.snapshot.params['id'];
    //this.dishservice.getDish(id).subscribe(dish => this.dish = dish);
    this.dishService.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => 
    {
      this.visibility = 'hidden';
      return this.dishService.getDish(params['id']);
    }
    ))
    .subscribe(dish => 
      { 
        this.dish = dish; 
        this.dishcopy = dish; 
        this.setPrevNext(dish.id);
        this.visibility = 'shown';
      }, 
    errmess => this.errMess = <any> errmess);
  
  }

  goBack(): void {
    this.location.back();
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  createForm() {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)] ],
      rating: ['5', [Validators.required] ],
      comment: ['', [Validators.required] ],
    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
  }

  onSubmit() {
    var today = new Date();
    
    console.log(today.toISOString());
    this.newComment = this.commentForm.value;
    this.newComment.date = today.toISOString();
    
    /* Add comment to dish*/
    this.dish.comments.push(this.newComment);
   
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });

    this.newComment = new Comment();
    
    /* reset */
    this.commentForm.reset({
      author: '',
      rating: '',
      comment: ''
    });

    
    this.commentFormDirective.resetForm(
      {
        author: '',
        rating: '5',
        comment: ''
      }
    ); /* reset to pristine*/
  }

  formErrors = {
    'author': '',
    'rating': '',
    'comment': ''
  };

  validationMessages = {
    'author': {
      'required':      'Name is required.',
      'minlength':     'Name must be at least 2 characters long.',
      'maxlength':     'Name cannot be more than 25 characters long.'
    },
    'comment': {
      'required':      'Comment is required.',
    }
  };

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    this.newComment.author = form.value.author;
    this.newComment.rating = form.value.rating;
    this.newComment.comment = form.value.comment;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
    
  }

}
